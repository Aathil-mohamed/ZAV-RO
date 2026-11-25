<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('size_group', 20)->default('upper')->after('garment_slug'); // upper | lower | dress
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->string('tryon_image_url')->nullable()->after('model_image_url');
        });

        Schema::create('try_on_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('input_path');
            $table->string('garment_url');
            $table->string('category', 12)->default('upper'); // upper | lower | dress
            $table->string('result_path')->nullable();
            $table->enum('status', ['queued', 'processing', 'done', 'failed'])->default('queued');
            $table->string('error')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        Schema::create('model_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->timestamp('consented_at');
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        Schema::create('tryon_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('model_photo_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('custom_design_id')->nullable()->constrained()->cascadeOnDelete();
            $table->enum('status', ['queued', 'processing', 'done', 'failed'])->default('queued');
            $table->string('result_path')->nullable();
            $table->string('error')->nullable();
            $table->timestamps();
            $table->unique(['model_photo_id', 'product_variant_id']);
            $table->unique(['model_photo_id', 'custom_design_id']);
        });

        Schema::create('size_charts', function (Blueprint $table) {
            $table->id();
            $table->enum('gender', ['men', 'women']);
            $table->string('garment_group', 20); // upper | lower | dress
            $table->string('size', 4);
            $table->unsignedSmallInteger('chest_cm')->nullable();
            $table->unsignedSmallInteger('waist_cm')->nullable();
            $table->unsignedSmallInteger('hip_cm')->nullable();
            $table->unique(['gender', 'garment_group', 'size']);
            $table->timestamps();
        });

        Schema::create('user_measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('height_cm');
            $table->unsignedSmallInteger('chest_cm')->nullable();
            $table->unsignedSmallInteger('waist_cm')->nullable();
            $table->unsignedSmallInteger('hip_cm')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_measurements');
        Schema::dropIfExists('size_charts');
        Schema::dropIfExists('tryon_results');
        Schema::dropIfExists('model_photos');
        Schema::dropIfExists('try_on_jobs');

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn('tryon_image_url');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('size_group');
        });
    }
};
