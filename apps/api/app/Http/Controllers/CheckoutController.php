<?php

namespace App\Http\Controllers;

use App\Events\OrderPaid;
use App\Models\Cart;
use App\Models\CustomDesign;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Payments\PaymentGateway;
use App\Services\DesignPricer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function create(Request $request, DesignPricer $pricer, PaymentGateway $gateway)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'shipping' => 'required|array',
            'shipping.first_name' => 'required|string|max:80',
            'shipping.last_name' => 'required|string|max:80',
            'shipping.phone' => 'required|string|max:30',
            'shipping.address' => 'required|string|max:200',
            'shipping.city' => 'required|string|max:100',
            'items' => 'required|array|min:1|max:30',
            'items.*.variant_id' => 'nullable|integer|exists:product_variants,id',
            'items.*.custom_design_id' => 'nullable|integer|exists:custom_designs,id',
            'items.*.size' => 'nullable|in:XS,S,M,L,XL,XXL',
            'items.*.qty' => 'required|integer|between:1,10',
        ]);

        return DB::transaction(function () use ($data, $request, $pricer, $gateway) {
            $subtotal = 0;
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
                $rows[] = [
                    'product_variant_id' => $i['variant_id'] ?? null,
                    'custom_design_id' => $i['custom_design_id'] ?? null,
                    'name' => $name,
                    'size' => $i['size'] ?? null,
                    'qty' => $i['qty'],
                    'unit_price_cents' => $price,
                ];
            }

            $freeOver = (int) config('store.free_shipping_over_cents', 1500000);
            $shipping = $subtotal >= $freeOver ? 0 : (int) config('store.shipping_cents', 45000);

            $order = Order::create([
                'user_id' => $request->user()?->id,
                'email' => $data['email'],
                'payment_provider' => 'payhere',
                'subtotal_cents' => $subtotal,
                'shipping_cents' => $shipping,
                'total_cents' => $subtotal + $shipping,
                'shipping_address' => $data['shipping'],
            ]);
            $order->items()->createMany($rows);

            $payment = $gateway->startPayment($order, $data['shipping']);

            return [
                'orderNumber' => $order->order_number,
                'viewToken' => $order->view_token,
                'action' => $payment['action'],
                'fields' => $payment['fields'],
            ];
        });
    }

    public function retry(Request $request, string $orderNumber, PaymentGateway $gateway)
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $authorized = ($request->user() && $order->user_id === $request->user()->id)
            || ($request->query('token') && hash_equals((string) $order->view_token, (string) $request->query('token')))
            || ($request->input('token') && hash_equals((string) $order->view_token, (string) $request->input('token')));

        abort_unless($authorized, 403, 'Unauthorized');
        abort_unless($order->status === 'pending', 422, 'Order is not pending');

        $payment = $gateway->startPayment($order, $order->shipping_address ?? []);

        return [
            'orderNumber' => $order->order_number,
            'action' => $payment['action'],
            'fields' => $payment['fields'],
        ];
    }

    public function notify(Request $request)
    {
        $secretHash = strtoupper(md5((string) config('services.payhere.secret')));
        $local = strtoupper(md5(
            $request->merchant_id .
            $request->order_id .
            $request->payhere_amount .
            $request->payhere_currency .
            $request->status_code .
            $secretHash
        ));

        if (! hash_equals($local, (string) $request->md5sig) || $request->merchant_id !== config('services.payhere.merchant_id')) {
            Log::warning('PayHere notify: bad signature', ['order_id' => $request->order_id]);

            return response('invalid', 400);
        }

        $orderIdStr = (string) $request->order_id;
        $pos = strrpos($orderIdStr, '-');
        $orderNumber = $pos !== false ? substr($orderIdStr, 0, $pos) : $orderIdStr;

        DB::transaction(function () use ($request, $orderNumber) {
            $order = Order::where('order_number', $orderNumber)->lockForUpdate()->first();
            if (! $order || $order->status !== 'pending') {
                return;
            }

            $expectedCur = config('store.currency', 'LKR');
            $amountOk = $request->payhere_currency === $expectedCur
                && $request->payhere_amount === number_format($order->total_cents / 100, 2, '.', '');

            if ((int) $request->status_code === 2 && $amountOk) {
                $order->update(['status' => 'paid', 'payment_ref' => $request->payment_id]);
                foreach ($order->items as $it) {
                    if ($it->product_variant_id) {
                        ProductVariant::whereKey($it->product_variant_id)->decrement('stock', $it->qty);
                    }
                }
                if ($order->user_id) {
                    Cart::where('user_id', $order->user_id)->first()?->items()->delete();
                }
                DB::afterCommit(fn () => OrderPaid::dispatch($order));
            } elseif ((int) $request->status_code === 2) {
                Log::alert('PayHere notify: amount mismatch', [
                    'order' => $orderNumber,
                    'expected' => number_format($order->total_cents / 100, 2, '.', ''),
                    'got' => $request->payhere_amount,
                    'currency' => $request->payhere_currency,
                ]);
            }
        });

        return response('', 200);
    }

    public function showByOrderNumber(Request $request, string $orderNumber)
    {
        $order = Order::with('items')->where('order_number', $orderNumber)->firstOrFail();

        $authorized = ($request->user() && $order->user_id === $request->user()->id)
            || ($request->query('token') && hash_equals((string) $order->view_token, (string) $request->query('token')));

        abort_unless($authorized, 403, 'Unauthorized');

        return [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
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
}
