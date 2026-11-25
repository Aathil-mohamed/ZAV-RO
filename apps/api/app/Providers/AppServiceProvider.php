<?php

namespace App\Providers;

use App\Payments\PayHereGateway;
use App\Payments\PaymentGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, function () {
            return match (env('PAYMENT_GATEWAY', 'payhere')) {
                'payhere' => new PayHereGateway(),
                default => new PayHereGateway(),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
