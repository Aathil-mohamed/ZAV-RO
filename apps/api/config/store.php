<?php

return [
    'currency' => env('STORE_CURRENCY', 'LKR'),
    'shipping_cents' => (int) env('STORE_SHIPPING_CENTS', 45000), // Rs 450.00
    'free_shipping_over_cents' => (int) env('STORE_FREE_SHIPPING_OVER_CENTS', 1500000), // Rs 15,000.00
];
