<?php

namespace App\Payments;

use App\Models\Order;

class PayHereGateway implements PaymentGateway
{
    public function startPayment(Order $order, array $c): array
    {
        $order->increment('payment_attempts');
        $payId = $order->order_number . '-' . $order->payment_attempts;
        $amount = number_format($order->total_cents / 100, 2, '.', '');
        $cur = config('store.currency', 'LKR');
        $mid = (string) config('services.payhere.merchant_id');
        $secret = (string) config('services.payhere.secret');
        $hash = self::makeStartHash($mid, $payId, $amount, $cur, $secret);
        $base = config('services.payhere.mode') === 'live'
            ? 'https://www.payhere.lk'
            : 'https://sandbox.payhere.lk';

        return [
            'action' => "{$base}/pay/checkout",
            'fields' => [
                'merchant_id' => $mid,
                'return_url' => rtrim(config('app.frontend_url'), '/') . "/order/{$order->order_number}?token={$order->view_token}",
                'cancel_url' => rtrim(config('app.frontend_url'), '/') . '/?cart=1',
                'notify_url' => (string) config('services.payhere.notify_url'),
                'order_id' => $payId,
                'items' => "Order {$order->order_number}",
                'currency' => $cur,
                'amount' => $amount,
                'first_name' => $c['first_name'],
                'last_name' => $c['last_name'],
                'email' => $order->email,
                'phone' => $c['phone'],
                'address' => $c['address'],
                'city' => $c['city'],
                'country' => 'Sri Lanka',
                'hash' => $hash,
            ],
        ];
    }

    public static function makeStartHash(
        string $merchantId,
        string $orderId,
        string $amount,
        string $currency,
        string $secret,
    ): string {
        $secretHash = strtoupper(md5($secret));

        return strtoupper(md5($merchantId . $orderId . $amount . $currency . $secretHash));
    }
}
