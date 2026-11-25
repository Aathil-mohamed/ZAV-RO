<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_designs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_token', 40)->nullable()->index();
            $table->string('garment_slug');
            $table->json('design');               // {"panels":{...},"variants":{...}}
            $table->string('size', 4)->nullable();
            $table->unsignedInteger('price_cents');
            $table->string('preview_path')->nullable();
            $table->string('share_token', 32)->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_designs');
    }
};
