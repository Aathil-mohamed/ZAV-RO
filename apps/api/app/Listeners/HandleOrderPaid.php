<?php

namespace App\Listeners;

use App\Events\OrderPaid;
use App\Jobs\BuildProductionPack;
use App\Mail\OrderConfirmationMail;
use App\Mail\OrderInProductionMail;
use Illuminate\Support\Facades\Mail;

class HandleOrderPaid
{
    public function handle(OrderPaid $event): void
    {
        $order = $event->order->loadMissing('items.customDesign');

        Mail::to($order->email)->queue(new OrderConfirmationMail($order));

        $hasCustom = false;
        foreach ($order->items as $item) {
            if ($item->custom_design_id) {
                $hasCustom = true;
                BuildProductionPack::dispatch($order, $item);
            }
        }

        if ($hasCustom) {
            Mail::to($order->email)->queue(new OrderInProductionMail($order));
        }
    }
}
