<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class SimulatePayHere extends Command
{
    protected $signature = 'payhere:simulate
        {order_number : Order number (e.g. ORD-000001-ABC)}
        {--status=2 : PayHere status_code (2=success, 0=pending, -1=canceled, -2=failed)}
        {--amount= : Override payhere_amount (e.g. 1.00 to test mismatch)}
        {--bad-sig : Send an invalid md5sig}';

    protected $description = 'Simulate a PayHere server notification to /api/payhere/notify locally';

    public function handle(): int
    {
        $orderNumber = (string) $this->argument('order_number');
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $mid = (string) config('services.payhere.merchant_id');
        $secret = (string) config('services.payhere.secret');
        $currency = config('store.currency', 'LKR');
        $amount = $this->option('amount') !== null && $this->option('amount') !== ''
            ? (string) $this->option('amount')
            : number_format($order->total_cents / 100, 2, '.', '');
        $status = (string) $this->option('status');
        $payId = $order->order_number . '-' . max(1, (int) $order->payment_attempts);

        $secretHash = strtoupper(md5($secret));
        $md5sig = $this->option('bad-sig')
            ? 'BAD_SIGNATURE'
            : strtoupper(md5($mid . $payId . $amount . $currency . $status . $secretHash));

        $req = Request::create('/api/payhere/notify', 'POST', [
            'merchant_id' => $mid,
            'order_id' => $payId,
            'payment_id' => 'SIM-' . uniqid(),
            'payhere_amount' => $amount,
            'payhere_currency' => $currency,
            'status_code' => $status,
            'md5sig' => $md5sig,
        ]);

        $res = app()->handle($req);
        $this->info("Notify response: HTTP {$res->getStatusCode()} (order status now: {$order->fresh()->status})");

        return self::SUCCESS;
    }
}
