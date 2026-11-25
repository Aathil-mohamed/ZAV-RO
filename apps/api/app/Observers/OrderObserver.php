<?php

namespace App\Observers;

use App\Mail\OrderInProductionMail;
use App\Mail\OrderShippedMail;
use App\Models\Order;
use Illuminate\Support\Facades\Mail;

class OrderObserver
{
    public function updated(Order $order): void
    {
        if (! $order->wasChanged('status')) {
            return;
        }

        if ($order->status === 'in_production') {
            Mail::to($order->email)->queue(new OrderInProductionMail($order));
        } elseif ($order->status === 'shipped') {
            Mail::to($order->email)->queue(new OrderShippedMail($order));
        }
    }
}
