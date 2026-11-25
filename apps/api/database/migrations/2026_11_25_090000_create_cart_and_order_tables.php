<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
        });

        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('custom_design_id')->nullable()->constrained()->nullOnDelete();
            $table->string('size', 4)->nullable();
            $table->unsignedSmallInteger('qty')->default(1);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email');
            $table->enum('status', ['pending', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled'])->default('pending');
            $table->unsignedInteger('subtotal_cents');
            $table->unsignedInteger('shipping_cents')->default(0);
            $table->unsignedInteger('total_cents');
            $table->string('stripe_session_id')->nullable()->unique();
            $table->json('shipping_address');
            $table->string('tracking_number')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('custom_design_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('size', 4)->nullable();
            $table->unsignedSmallInteger('qty');
            $table->unsignedInteger('unit_price_cents');
            $table->string('production_pack_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });
    }
};
