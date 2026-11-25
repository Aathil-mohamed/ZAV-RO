<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_number')->unique()->nullable()->after('id');
            $table->string('view_token', 40)->nullable()->after('order_number');
            $table->string('payment_provider')->default('payhere')->after('status');
            $table->string('payment_ref')->nullable()->after('payment_provider');
            $table->unsignedSmallInteger('payment_attempts')->default(0)->after('payment_ref');
            $table->dropUnique(['stripe_session_id']);
            $table->dropColumn('stripe_session_id');
        });

        // One-time placeholder LKR conversion (USD-like cents x 300)
        DB::table('products')->update(['price_cents' => DB::raw('price_cents * 300')]);
        DB::table('custom_designs')->update(['price_cents' => DB::raw('price_cents * 300')]);
    }

    public function down(): void
    {
        DB::table('products')->update(['price_cents' => DB::raw('price_cents / 300')]);
        DB::table('custom_designs')->update(['price_cents' => DB::raw('price_cents / 300')]);

        Schema::table('orders', function (Blueprint $table) {
            $table->string('stripe_session_id')->nullable()->unique()->after('total_cents');
            $table->dropColumn([
                'order_number',
                'view_token',
                'payment_provider',
                'payment_ref',
                'payment_attempts',
            ]);
        });
    }
};
