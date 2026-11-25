<?php

namespace App\Http\Controllers;

use App\Events\OrderPaid;
use App\Models\Cart;
use App\Models\CustomDesign;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Services\DesignPricer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function create(Request $request, DesignPricer $pricer)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'shipping' => 'required|array',
            'shipping.name' => 'required|string|max:120',
            'shipping.line1' => 'required|string|max:200',
            'shipping.city' => 'required|string|max:100',
            'shipping.postal_code' => 'required|string|max:20',
            'shipping.country' => 'required|string|size:2',
            'items' => 'required|array|min:1|max:30',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.custom_design_id' => 'nullable|integer|exists:custom_designs,id',
            'items.*.size' => 'nullable|in:XS,S,M,L,XL,XXL',
            'items.*.qty' => 'required|integer|between:1,10',
        ]);

        return DB::transaction(function () use ($data, $request, $pricer) {
            $subtotal = 0;
            $stripeLines = [];
            $rows = [];

            foreach ($data['items'] as $i) {
                abort_unless(
                    (! empty($i['variant_id'])) xor (! empty($i['custom_design_id'])),
                    422,
                    'Each line needs a variant or a design'
                );

                if (! empty($i['variant_id'])) {
                    $v = ProductVariant::with('product')->lockForUpdate()->findOrFail($i['variant_id']);
                    abort_unless($v->product && $v->product->active && $v->stock >= $i['qty'], 422, "{$v->product->name} is out of stock");
                    $price = (int) $v->product->price_cents;
                    $name = "{$v->product->name} ({$v->color})";
                } else {
                    $d = CustomDesign::findOrFail($i['custom_design_id']);
                    $owns = ($request->user() && $d->user_id === $request->user()->id)
                        || ($d->guest_token && $d->guest_token === $request->cookie('guest'));
                    abort_unless($owns, 403, 'Design does not belong to you');
                    $price = (int) $d->price_cents;
                    $garmentName = $pricer->garment($d->garment_slug)['name'] ?? $d->garment_slug;
                    $name = 'Custom ' . $garmentName;
                }

                $subtotal += $price * $i['qty'];
                $stripeLines[] = [
                    'price_data' => [
                        'currency' => 'usd',
                        'unit_amount' => $price,
                        'product_data' => ['name' => $name],
                    ],
                    'quantity' => $i['qty'],
                ];
                $rows[] = [
                    'product_variant_id' => $i['variant_id'] ?? null,
                    'custom_design_id' => $i['custom_design_id'] ?? null,
                    'name' => $name,
                    'size' => $i['size'] ?? null,
                    'qty' => $i['qty'],
                    'unit_price_cents' => $price,
                ];
            }

            $shipping = $subtotal >= 10000 ? 0 : 600;
            $order = Order::create([
                'user_id' => $request->user()?->id,
                'email' => $data['email'],
                'subtotal_cents' => $subtotal,
                'shipping_cents' => $shipping,
                'total_cents' => $subtotal + $shipping,
                'shipping_address' => $data['shipping'],
            ]);
            $order->items()->createMany($rows);

            if ($shipping > 0) {
                $stripeLines[] = [
                    'price_data' => [
                        'currency' => 'usd',
                        'unit_amount' => $shipping,
                        'product_data' => ['name' => 'Shipping'],
                    ],
                    'quantity' => 1,
                ];
            }

            $session = $this->createStripeSession([
                'mode' => 'payment',
                'line_items' => $stripeLines,
                'customer_email' => $data['email'],
                'success_url' => rtrim(config('app.frontend_url'), '/') . '/order/{CHECKOUT_SESSION_ID}',
                'cancel_url' => rtrim(config('app.frontend_url'), '/') . '/?cart=1',
                'metadata' => ['order_id' => $order->id],
            ]);

            $order->update(['stripe_session_id' => $session->id]);

            return ['url' => $session->url, 'sessionId' => $session->id, 'orderId' => $order->id];
        });
    }

    public function webhook(Request $request)
    {
        try {
            $event = $this->constructStripeEvent(
                $request->getContent(),
                (string) $request->header('Stripe-Signature'),
                (string) config('services.stripe.webhook')
            );
        } catch (\Throwable $e) {
            return response('bad signature', 400);
        }

        if ($event->type === 'checkout.session.completed') {
            DB::transaction(function () use ($event) {
                $order = Order::lockForUpdate()->findOrFail($event->data->object->metadata->order_id);
                if ($order->status !== 'pending') {
                    return; // idempotent
                }
                $order->update(['status' => 'paid']);
                foreach ($order->items as $it) {
                    if ($it->product_variant_id) {
                        ProductVariant::whereKey($it->product_variant_id)->decrement('stock', $it->qty);
                    }
                }
                if ($order->user_id) {
                    Cart::where('user_id', $order->user_id)->first()?->items()->delete();
                }
                DB::afterCommit(fn () => OrderPaid::dispatch($order));
            });
        }

        return response()->noContent();
    }

    public function showBySession(string $session)
    {
        $order = Order::with('items')->where('stripe_session_id', $session)->firstOrFail();

        return [
            'id' => $order->id,
            'status' => $order->status,
            'email' => $order->email,
            'subtotalCents' => $order->subtotal_cents,
            'shippingCents' => $order->shipping_cents,
            'totalCents' => $order->total_cents,
            'trackingNumber' => $order->tracking_number,
            'items' => $order->items->map(fn ($it) => [
                'id' => $it->id,
                'name' => $it->name,
                'size' => $it->size,
                'qty' => $it->qty,
                'unitPriceCents' => $it->unit_price_cents,
                'customDesignId' => $it->custom_design_id,
            ])->values(),
        ];
    }

    protected function createStripeSession(array $params): object
    {
        \Stripe\Stripe::setApiKey(config('services.stripe.secret'));

        return \Stripe\Checkout\Session::create($params);
    }

    protected function constructStripeEvent(string $payload, string $sigHeader, string $secret): object
    {
        return \Stripe\Webhook::constructEvent($payload, $sigHeader, $secret);
    }
}
