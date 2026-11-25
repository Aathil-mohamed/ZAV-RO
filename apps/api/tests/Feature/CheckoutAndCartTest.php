<?php

use App\Events\OrderPaid;
use App\Http\Controllers\CheckoutController;
use App\Jobs\BuildProductionPack;
use App\Models\Category;
use App\Models\CustomDesign;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Filament\Panel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function makeTestProduct(int $priceCents = 4500, int $stock = 5, bool $active = true): ProductVariant
{
    $cat = Category::firstOrCreate(['slug' => 'men-tops'], ['name' => 'Men Tops', 'gender' => 'men']);
    $p = Product::create([
        'category_id' => $cat->id,
        'name' => 'Heavyweight Tee',
        'price_cents' => $priceCents,
        'thumb_url' => '/dev-models/men/tee.webp',
        'active' => $active,
    ]);

    return ProductVariant::create([
        'product_id' => $p->id,
        'color' => 'Black',
        'hex' => '#000000',
        'model_image_url' => '/dev-models/men/tee-black.webp',
        'sku' => 'TEE-' . uniqid(),
        'stock' => $stock,
    ]);
}

function fakeStripeCheckoutController(): void
{
    app()->bind(CheckoutController::class, function () {
        return new class extends CheckoutController {
            protected function createStripeSession(array $params): object
            {
                return (object) ['id' => 'cs_test_' . uniqid(), 'url' => 'https://checkout.stripe.test/session'];
            }

            protected function constructStripeEvent(string $payload, string $sigHeader, string $secret): object
            {
                if ($sigHeader !== 'valid-sig') {
                    throw new \RuntimeException('Invalid signature');
                }
                return json_decode($payload, false, 512, JSON_THROW_ON_ERROR);
            }
        };
    });
}

// --- Cart Merge ---

test('cart merge caps quantities at 10, uses DB prices, and rejects unknown variants', function () {
    $user = User::factory()->create();
    $v = makeTestProduct(5500, 10);

    $res = $this->actingAs($user)->postJson('/api/cart/merge', [
        'lines' => [
            ['variantId' => $v->id, 'size' => 'M', 'qty' => 25, 'priceCents' => 1],
        ],
    ]);

    $res->assertStatus(200);
    expect($res->json('lines.0.qty'))->toBe(10);
    expect($res->json('lines.0.priceCents'))->toBe(5500);

    // Unknown variant
    $this->actingAs($user)->postJson('/api/cart/merge', [
        'lines' => [['variantId' => 999999, 'size' => 'M', 'qty' => 1]],
    ])->assertStatus(422);
});

// --- Checkout ---

test('checkout ignores client price, rejects out-of-stock, and rejects other users custom designs', function () {
    fakeStripeCheckoutController();

    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $v = makeTestProduct(4000, 2);

    $shipping = [
        'name' => 'Aathil',
        'line1' => '123 Main St',
        'city' => 'Colombo',
        'postal_code' => '00100',
        'country' => 'LK',
    ];

    // Out of stock (qty 5 > stock 2)
    $this->actingAs($userA)->postJson('/api/checkout', [
        'email' => 'a@example.com',
        'shipping' => $shipping,
        'items' => [['variant_id' => $v->id, 'size' => 'M', 'qty' => 5]],
    ])->assertStatus(422);

    // Custom design belonging to userA cannot be checked out by userB
    $design = CustomDesign::create([
        'user_id' => $userA->id,
        'garment_slug' => 'mens-tshirt',
        'design' => ['panels' => [], 'variants' => []],
        'size' => 'M',
        'price_cents' => 3500,
        'share_token' => str_repeat('a', 32),
    ]);

    $this->actingAs($userB)->postJson('/api/checkout', [
        'email' => 'b@example.com',
        'shipping' => $shipping,
        'items' => [['custom_design_id' => $design->id, 'size' => 'M', 'qty' => 1]],
    ])->assertStatus(403);

    // Valid checkout by userA: ignores any client-sent price_cents
    $ok = $this->actingAs($userA)->postJson('/api/checkout', [
        'email' => 'a@example.com',
        'shipping' => $shipping,
        'items' => [
            ['variant_id' => $v->id, 'size' => 'M', 'qty' => 1, 'unit_price_cents' => 1],
            ['custom_design_id' => $design->id, 'size' => 'M', 'qty' => 1, 'unit_price_cents' => 1],
        ],
    ]);
    $ok->assertStatus(200)->assertJsonStructure(['url', 'sessionId', 'orderId']);

    $order = Order::findOrFail($ok->json('orderId'));
    // 4000 + 3500 = 7500 (< 10000 -> +600 shipping = 8100)
    expect($order->subtotal_cents)->toBe(7500);
    expect($order->shipping_cents)->toBe(600);
    expect($order->total_cents)->toBe(8100);
});

// --- Stripe Webhook ---

test('stripe webhook rejects bad signature and is idempotent on duplicate delivery', function () {
    fakeStripeCheckoutController();
    Event::fake([OrderPaid::class]);

    $v = makeTestProduct(5000, 5);
    $order = Order::create([
        'email' => 'buyer@example.com',
        'status' => 'pending',
        'subtotal_cents' => 5000,
        'shipping_cents' => 600,
        'total_cents' => 5600,
        'stripe_session_id' => 'cs_test_webhook_1',
        'shipping_address' => ['name' => 'Buyer', 'line1' => '1 St', 'city' => 'NY', 'postal_code' => '10001', 'country' => 'US'],
    ]);
    $order->items()->create([
        'product_variant_id' => $v->id,
        'name' => 'Heavyweight Tee (Black)',
        'size' => 'M',
        'qty' => 2,
        'unit_price_cents' => 5000,
    ]);

    $payload = json_encode([
        'type' => 'checkout.session.completed',
        'data' => ['object' => ['metadata' => ['order_id' => $order->id]]],
    ]);

    // Bad signature -> 400
    $this->call('POST', '/api/stripe/webhook', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => 'bad-sig',
        'CONTENT_TYPE' => 'application/json',
    ], $payload)->assertStatus(400);

    // Valid signature twice -> stock decremented ONCE, OrderPaid dispatched ONCE
    $this->call('POST', '/api/stripe/webhook', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => 'valid-sig',
        'CONTENT_TYPE' => 'application/json',
    ], $payload)->assertStatus(204);

    $this->call('POST', '/api/stripe/webhook', [], [], [], [
        'HTTP_STRIPE_SIGNATURE' => 'valid-sig',
        'CONTENT_TYPE' => 'application/json',
    ], $payload)->assertStatus(204);

    expect($order->fresh()->status)->toBe('paid');
    expect($v->fresh()->stock)->toBe(3);
    Event::assertDispatchedTimes(OrderPaid::class, 1);
});

// --- Production Pack & Admin Restriction ---

test('BuildProductionPack generates zip in private storage and only admins can access Filament', function () {
    Storage::fake('s3-private');
    Storage::fake('s3-public');

    $admin = User::factory()->create(['is_admin' => true]);
    $regular = User::factory()->create(['is_admin' => false]);
    $panel = \Mockery::mock(Panel::class);

    expect($admin->canAccessPanel($panel))->toBeTrue();
    expect($regular->canAccessPanel($panel))->toBeFalse();

    $design = CustomDesign::create([
        'user_id' => $regular->id,
        'garment_slug' => 'mens-tshirt',
        'design' => [
            'panels' => [
                'front' => ['fill' => '#ff0000', 'fabric' => 'cotton', 'layers' => []],
            ],
            'variants' => [],
        ],
        'size' => 'M',
        'price_cents' => 2500,
        'share_token' => str_repeat('b', 32),
    ]);

    $order = Order::create([
        'user_id' => $regular->id,
        'email' => $regular->email,
        'status' => 'paid',
        'subtotal_cents' => 2500,
        'shipping_cents' => 600,
        'total_cents' => 3100,
        'shipping_address' => ['name' => 'Reg', 'line1' => '1 St', 'city' => 'NY', 'postal_code' => '10001', 'country' => 'US'],
    ]);
    $item = $order->items()->create([
        'custom_design_id' => $design->id,
        'name' => 'Custom T-shirt',
        'size' => 'M',
        'qty' => 1,
        'unit_price_cents' => 2500,
    ]);

    (new BuildProductionPack($order, $item))->handle();

    $item->refresh();
    expect($item->production_pack_path)->toBe("production/order-{$order->id}-item-{$item->id}.zip");
    Storage::disk('s3-private')->assertExists($item->production_pack_path);
});
