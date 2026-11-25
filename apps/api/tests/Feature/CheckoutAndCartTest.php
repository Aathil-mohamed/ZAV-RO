<?php

use App\Events\OrderPaid;
use App\Jobs\BuildProductionPack;
use App\Mail\OrderConfirmationMail;
use App\Models\Category;
use App\Models\CustomDesign;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Payments\PayHereGateway;
use Filament\Panel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    config()->set('services.payhere.mode', 'sandbox');
    config()->set('services.payhere.merchant_id', '1211149');
    config()->set('services.payhere.secret', 'test-payhere-secret');
    config()->set('services.payhere.notify_url', 'https://example.test/api/payhere/notify');
});

function makeTestProduct(int $priceCents = 450000, int $stock = 5, bool $active = true): ProductVariant
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

function signNotify(string $mid, string $orderId, string $amount, string $currency, string $status, string $secret): string
{
    $secretHash = strtoupper(md5($secret));

    return strtoupper(md5($mid . $orderId . $amount . $currency . $status . $secretHash));
}

// --- Cart Merge ---

test('cart merge caps quantities at 10, uses DB prices, and rejects unknown variants', function () {
    $user = User::factory()->create();
    $v = makeTestProduct(550000, 10);

    $res = $this->actingAs($user)->postJson('/api/cart/merge', [
        'lines' => [
            ['variantId' => $v->id, 'size' => 'M', 'qty' => 25, 'priceCents' => 1],
        ],
    ]);

    $res->assertStatus(200);
    expect($res->json('lines.0.qty'))->toBe(10);
    expect($res->json('lines.0.priceCents'))->toBe(550000);

    $this->actingAs($user)->postJson('/api/cart/merge', [
        'lines' => [['variantId' => 999999, 'size' => 'M', 'qty' => 1]],
    ])->assertStatus(422);
});

// --- PayHere Start Payment Hash ---

test('PayHere startPayment hash matches documented formula for a fixed sample', function () {
    $order = Order::create([
        'order_number' => 'ORD-000001-TST',
        'view_token' => str_repeat('v', 40),
        'email' => 'buyer@example.com',
        'subtotal_cents' => 250000,
        'shipping_cents' => 0,
        'total_cents' => 250000,
        'shipping_address' => ['first_name' => 'Aathil', 'last_name' => 'M', 'phone' => '0771234567', 'address' => '1 Galle Rd', 'city' => 'Colombo'],
    ]);

    $gw = new PayHereGateway();
    $out = $gw->startPayment($order, $order->shipping_address);

    $expectedHash = strtoupper(md5('1211149' . 'ORD-000001-TST-1' . '2500.00' . 'LKR' . strtoupper(md5('test-payhere-secret'))));
    expect($out['action'])->toBe('https://sandbox.payhere.lk/pay/checkout');
    expect($out['fields']['hash'])->toBe($expectedHash);
    expect($out['fields']['amount'])->toBe('2500.00');
    expect($out['fields']['currency'])->toBe('LKR');
});

// --- Checkout ---

test('checkout ignores client price, rejects out-of-stock, and rejects other users custom designs', function () {
    $userA = User::factory()->create();
    $userB = User::factory()->create();
    $v = makeTestProduct(400000, 2);

    $shipping = [
        'first_name' => 'Aathil',
        'last_name' => 'Mohamed',
        'phone' => '0771234567',
        'address' => '123 Galle Rd',
        'city' => 'Colombo',
    ];

    // Out of stock
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
        'price_cents' => 750000,
        'share_token' => str_repeat('a', 32),
    ]);

    $this->actingAs($userB)->postJson('/api/checkout', [
        'email' => 'b@example.com',
        'shipping' => $shipping,
        'items' => [['custom_design_id' => $design->id, 'size' => 'M', 'qty' => 1]],
    ])->assertStatus(403);

    // Valid checkout by userA
    $ok = $this->actingAs($userA)->postJson('/api/checkout', [
        'email' => 'a@example.com',
        'shipping' => $shipping,
        'items' => [
            ['variant_id' => $v->id, 'size' => 'M', 'qty' => 1, 'unit_price_cents' => 1],
            ['custom_design_id' => $design->id, 'size' => 'M', 'qty' => 1, 'unit_price_cents' => 1],
        ],
    ]);
    $ok->assertStatus(200)->assertJsonStructure(['orderNumber', 'viewToken', 'action', 'fields']);

    $order = Order::where('order_number', $ok->json('orderNumber'))->firstOrFail();
    // 400000 + 750000 = 1,150,000 (< 1,500,000 -> +45,000 shipping = 1,195,000)
    expect($order->subtotal_cents)->toBe(1150000);
    expect($order->shipping_cents)->toBe(45000);
    expect($order->total_cents)->toBe(1195000);
});

// --- PayHere Notify ---

test('valid payhere notify marks order paid, decrements stock once, sends email, and is idempotent', function () {
    Mail::fake();
    $v = makeTestProduct(500000, 5);

    $order = Order::create([
        'order_number' => 'ORD-000100-AAA',
        'view_token' => str_repeat('x', 40),
        'email' => 'buyer@example.com',
        'status' => 'pending',
        'subtotal_cents' => 1000000,
        'shipping_cents' => 45000,
        'total_cents' => 1045000,
        'payment_attempts' => 1,
        'shipping_address' => ['first_name' => 'B', 'last_name' => 'C', 'phone' => '077', 'address' => '1 St', 'city' => 'Colombo'],
    ]);
    $order->items()->create([
        'product_variant_id' => $v->id,
        'name' => 'Heavyweight Tee (Black)',
        'size' => 'M',
        'qty' => 2,
        'unit_price_cents' => 500000,
    ]);

    $sig = signNotify('1211149', 'ORD-000100-AAA-1', '10450.00', 'LKR', '2', 'test-payhere-secret');
    $payload = [
        'merchant_id' => '1211149',
        'order_id' => 'ORD-000100-AAA-1',
        'payment_id' => 'PH-999',
        'payhere_amount' => '10450.00',
        'payhere_currency' => 'LKR',
        'status_code' => '2',
        'md5sig' => $sig,
    ];

    $this->post('/api/payhere/notify', $payload)->assertStatus(200);
    $this->post('/api/payhere/notify', $payload)->assertStatus(200); // duplicate

    expect($order->fresh()->status)->toBe('paid');
    expect($order->fresh()->payment_ref)->toBe('PH-999');
    expect($v->fresh()->stock)->toBe(3);
    Mail::assertQueued(OrderConfirmationMail::class, 1);
});

test('payhere notify rejects bad signature, wrong merchant, logs amount mismatch, and keeps pending on -2/0', function () {
    $v = makeTestProduct(500000, 5);
    $order = Order::create([
        'order_number' => 'ORD-000200-BBB',
        'view_token' => str_repeat('y', 40),
        'email' => 'buyer2@example.com',
        'status' => 'pending',
        'subtotal_cents' => 500000,
        'shipping_cents' => 45000,
        'total_cents' => 545000,
        'payment_attempts' => 1,
        'shipping_address' => ['first_name' => 'B', 'last_name' => 'C', 'phone' => '077', 'address' => '1 St', 'city' => 'Colombo'],
    ]);

    // Bad signature
    $this->post('/api/payhere/notify', [
        'merchant_id' => '1211149',
        'order_id' => 'ORD-000200-BBB-1',
        'payhere_amount' => '5450.00',
        'payhere_currency' => 'LKR',
        'status_code' => '2',
        'md5sig' => 'BAD',
    ])->assertStatus(400);

    // Wrong merchant_id
    $wrongMidSig = signNotify('9999999', 'ORD-000200-BBB-1', '5450.00', 'LKR', '2', 'test-payhere-secret');
    $this->post('/api/payhere/notify', [
        'merchant_id' => '9999999',
        'order_id' => 'ORD-000200-BBB-1',
        'payhere_amount' => '5450.00',
        'payhere_currency' => 'LKR',
        'status_code' => '2',
        'md5sig' => $wrongMidSig,
    ])->assertStatus(400);

    // Unknown order -> 200 ignored
    $unknownSig = signNotify('1211149', 'ORD-UNKNOWN-1', '5450.00', 'LKR', '2', 'test-payhere-secret');
    $this->post('/api/payhere/notify', [
        'merchant_id' => '1211149',
        'order_id' => 'ORD-UNKNOWN-1',
        'payhere_amount' => '5450.00',
        'payhere_currency' => 'LKR',
        'status_code' => '2',
        'md5sig' => $unknownSig,
    ])->assertStatus(200);

    // Amount mismatch -> logs alert, stays pending
    Log::shouldReceive('alert')->once();
    $mismatchSig = signNotify('1211149', 'ORD-000200-BBB-1', '1.00', 'LKR', '2', 'test-payhere-secret');
    $this->post('/api/payhere/notify', [
        'merchant_id' => '1211149',
        'order_id' => 'ORD-000200-BBB-1',
        'payhere_amount' => '1.00',
        'payhere_currency' => 'LKR',
        'status_code' => '2',
        'md5sig' => $mismatchSig,
    ])->assertStatus(200);
    expect($order->fresh()->status)->toBe('pending');

    // Status -2 and 0 leave order pending
    foreach (['-2', '0'] as $st) {
        $sig = signNotify('1211149', 'ORD-000200-BBB-1', '5450.00', 'LKR', $st, 'test-payhere-secret');
        $this->post('/api/payhere/notify', [
            'merchant_id' => '1211149',
            'order_id' => 'ORD-000200-BBB-1',
            'payhere_amount' => '5450.00',
            'payhere_currency' => 'LKR',
            'status_code' => $st,
            'md5sig' => $sig,
        ])->assertStatus(200);
        expect($order->fresh()->status)->toBe('pending');
    }

    // Retry endpoint requires view_token and increments attempt suffix
    $this->postJson('/api/orders/ORD-000200-BBB/pay?token=wrong')->assertStatus(403);
    $retry = $this->postJson('/api/orders/ORD-000200-BBB/pay?token=' . str_repeat('y', 40));
    $retry->assertStatus(200);
    expect($retry->json('fields.order_id'))->toBe('ORD-000200-BBB-2');

    // Guest status endpoint requires view_token
    $this->getJson('/api/orders/ORD-000200-BBB')->assertStatus(403);
    $this->getJson('/api/orders/ORD-000200-BBB?token=' . str_repeat('y', 40))->assertStatus(200);
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
        'price_cents' => 750000,
        'share_token' => str_repeat('b', 32),
    ]);

    $order = Order::create([
        'order_number' => 'ORD-000300-CCC',
        'user_id' => $regular->id,
        'email' => $regular->email,
        'status' => 'paid',
        'subtotal_cents' => 750000,
        'shipping_cents' => 45000,
        'total_cents' => 795000,
        'shipping_address' => ['first_name' => 'Reg', 'last_name' => 'U', 'phone' => '077', 'address' => '1 St', 'city' => 'Colombo'],
    ]);
    $item = $order->items()->create([
        'custom_design_id' => $design->id,
        'name' => 'Custom T-shirt',
        'size' => 'M',
        'qty' => 1,
        'unit_price_cents' => 750000,
    ]);

    (new BuildProductionPack($order, $item))->handle();

    $item->refresh();
    expect($item->production_pack_path)->toBe("production/order-{$order->id}-item-{$item->id}.zip");
    Storage::disk('s3-private')->assertExists($item->production_pack_path);
});
