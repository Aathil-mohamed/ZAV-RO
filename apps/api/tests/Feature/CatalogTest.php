<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_men_returns_only_mens_and_unisex_products(): void
    {
        $menCategory = Category::create(['name' => 'Men Tops', 'slug' => 'men-tops', 'gender' => 'men']);
        $womenCategory = Category::create(['name' => 'Women Tops', 'slug' => 'women-tops', 'gender' => 'women']);
        $unisexCategory = Category::create(['name' => 'Unisex Accessories', 'slug' => 'unisex-acc', 'gender' => 'unisex']);

        $menProduct = Product::create([
            'category_id' => $menCategory->id,
            'name' => 'Men Hoodie',
            'price_cents' => 12000,
            'thumb_url' => '/dev-models/men/hoodie-thumb.webp',
            'active' => true,
        ]);
        ProductVariant::create([
            'product_id' => $menProduct->id,
            'color' => 'Black',
            'hex' => '#000000',
            'model_image_url' => '/dev-models/men/hoodie-black.webp',
            'sku' => 'MEN-HOODIE-BLK',
            'stock' => 10,
        ]);

        $unisexProduct = Product::create([
            'category_id' => $unisexCategory->id,
            'name' => 'Unisex Beanie',
            'price_cents' => 3500,
            'thumb_url' => '/dev-models/unisex/beanie-thumb.webp',
            'active' => true,
        ]);
        ProductVariant::create([
            'product_id' => $unisexProduct->id,
            'color' => 'Grey',
            'hex' => '#888888',
            'model_image_url' => '/dev-models/unisex/beanie-grey.webp',
            'sku' => 'UNI-BEANIE-GRY',
            'stock' => 5,
        ]);

        $womenProduct = Product::create([
            'category_id' => $womenCategory->id,
            'name' => 'Women Dress',
            'price_cents' => 15000,
            'thumb_url' => '/dev-models/women/dress-thumb.webp',
            'active' => true,
        ]);
        ProductVariant::create([
            'product_id' => $womenProduct->id,
            'color' => 'Red',
            'hex' => '#ff0000',
            'model_image_url' => '/dev-models/women/dress-red.webp',
            'sku' => 'WMN-DRESS-RED',
            'stock' => 8,
        ]);

        $response = $this->getJson('/api/catalog/men');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertCount(2, $data);

        $names = array_column($data, 'name');
        $this->assertContains('Men Hoodie', $names);
        $this->assertContains('Unisex Beanie', $names);
        $this->assertNotContains('Women Dress', $names);

        // Verify priceCents is integer
        foreach ($data as $item) {
            $this->assertIsInt($item['priceCents']);
        }
    }

    public function test_catalog_excludes_inactive_products(): void
    {
        $category = Category::create(['name' => 'Men Tops', 'slug' => 'men-tops', 'gender' => 'men']);

        $activeProduct = Product::create([
            'category_id' => $category->id,
            'name' => 'Active Shirt',
            'price_cents' => 5000,
            'thumb_url' => '/dev-models/men/shirt-thumb.webp',
            'active' => true,
        ]);
        ProductVariant::create([
            'product_id' => $activeProduct->id,
            'color' => 'White',
            'hex' => '#ffffff',
            'model_image_url' => '/dev-models/men/shirt-white.webp',
            'sku' => 'ACT-SHIRT-WHT',
            'stock' => 10,
        ]);

        $inactiveProduct = Product::create([
            'category_id' => $category->id,
            'name' => 'Inactive Shirt',
            'price_cents' => 5000,
            'thumb_url' => '/dev-models/men/shirt-thumb.webp',
            'active' => false,
        ]);
        ProductVariant::create([
            'product_id' => $inactiveProduct->id,
            'color' => 'Black',
            'hex' => '#000000',
            'model_image_url' => '/dev-models/men/shirt-black.webp',
            'sku' => 'INACT-SHIRT-BLK',
            'stock' => 10,
        ]);

        $response = $this->getJson('/api/catalog/men');
        $response->assertStatus(200);

        $data = $response->json();
        $names = array_column($data, 'name');

        $this->assertContains('Active Shirt', $names);
        $this->assertNotContains('Inactive Shirt', $names);
    }

    public function test_catalog_is_cached_and_busted_on_product_save(): void
    {
        Cache::flush();

        $category = Category::create(['name' => 'Men Tops', 'slug' => 'men-tops', 'gender' => 'men']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Cached Item',
            'price_cents' => 6000,
            'thumb_url' => '/dev-models/men/cached-thumb.webp',
            'active' => true,
        ]);
        ProductVariant::create([
            'product_id' => $product->id,
            'color' => 'Navy',
            'hex' => '#000080',
            'model_image_url' => '/dev-models/men/cached-navy.webp',
            'sku' => 'CACHE-ITEM-NVY',
            'stock' => 10,
        ]);

        $this->assertFalse(Cache::has('catalog:men'));

        $this->getJson('/api/catalog/men')->assertStatus(200);

        $this->assertTrue(Cache::has('catalog:men'));

        // Updating a product busts the cache via CatalogObserver
        $product->update(['name' => 'Updated Cached Item']);

        $this->assertFalse(Cache::has('catalog:men'));
    }
}
