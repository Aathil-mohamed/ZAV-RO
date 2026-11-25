<?php

namespace App\Payments;

use App\Models\Order;

interface PaymentGateway
{
    /**
     * Returns what the browser needs to start payment:
     * ['action' => url, 'fields' => [...]]
     */
    public function startPayment(Order $order, array $customer): array;
}
