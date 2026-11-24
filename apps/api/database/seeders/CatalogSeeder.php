<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $catalog = [
            // MEN (8 Products)
            [
                'gender' => 'men',
                'slug' => 'mens-hoodie',
                'name' => "Men's Heavyweight Hoodie",
                'category' => 'Hoodies & Sweatshirts',
                'price_cents' => 12000,
                'customizable' => true,
                'colors' => [
                    ['name' => 'Onyx Black', 'slug' => 'black', 'hex' => '#18181b', 'inStock' => true],
                    ['name' => 'Heather Grey', 'slug' => 'heather-grey', 'hex' => '#71717a', 'inStock' => true],
                    ['name' => 'Midnight Navy', 'slug' => 'navy', 'hex' => '#1e3a8a', 'inStock' => true],
                    ['name' => 'Forest Green', 'slug' => 'forest-green', 'hex' => '#14532d', 'inStock' => false],
                ],
            ],
            [
                'gender' => 'men',
                'slug' => 'mens-tshirt',
                'name' => "Men's Boxy Fit Tee",
                'category' => 'T-Shirts',
                'price_cents' => 5500,
                'customizable' => true,
                'colors' => [
                    ['name' => 'Optic White', 'slug' => 'white', 'hex' => '#f8fafc', 'inStock' => true],
                    ['name' => 'Pure Black', 'slug' => 'black', 'hex' => '#18181b', 'inStock' => true],
                    ['name' => 'Army Olive', 'slug' => 'olive', 'hex' => '#3f6212', 'inStock' => true],
                    ['name' => 'Slate Grey', 'slug' => 'slate', 'hex' => '#475569', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'men',
                'slug' => 'mens-crewneck',
                'name' => "Men's French Terry Crewneck",
                'category' => 'Hoodies & Sweatshirts',
                'price_cents' => 9800,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Charcoal', 'slug' => 'charcoal', 'hex' => '#27272a', 'inStock' => true],
                    ['name' => 'Sand Oat', 'slug' => 'sand', 'hex' => '#d6c7b2', 'inStock' => true],
                    ['name' => 'Deep Teal', 'slug' => 'teal', 'hex' => '#0f766e', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'men',
                'slug' => 'mens-jacket',
                'name' => "Men's Minimalist Coach Jacket",
                'category' => 'Jackets & Outerwear',
                'price_cents' => 18500,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Matte Black', 'slug' => 'black', 'hex' => '#09090b', 'inStock' => true],
                    ['name' => 'Burnt Ochre', 'slug' => 'ochre', 'hex' => '#b45309', 'inStock' => true],
                    ['name' => 'Stone Grey', 'slug' => 'stone', 'hex' => '#a8a29e', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'men',
                'slug' => 'mens-longsleeve',
                'name' => "Men's Relaxed Longsleeve",
                'category' => 'T-Shirts',
                'price_cents' => 6800,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Bone White', 'slug' => 'bone', 'hex' => '#f1f5f9', 'inStock' => true],
                    ['name' => 'Washed Black', 'slug' => 'washed-black', 'hex' => '#334155', 'inStock' => true],
                    ['name' => 'Cognac', 'slug' => 'cognac', 'hex' => '#9a3412', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'men',
                'slug' => 'mens-oversized-tee',
                'name' => "Men's Streetwear Oversized Tee",
                'category' => 'T-Shirts',
                'price_cents' => 6200,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Off-White', 'slug' => 'off-white', 'hex' => '#e2e8f0', 'inStock' => true],
                    ['name' => 'Tar Black', 'slug' => 'tar-black', 'hex' => '#1e293b', 'inStock' => true],
                    ['name' => 'Moss Green', 'slug' => 'moss', 'hex' => '#365314', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'men',
                'slug' => 'mens-zip-hoodie',
                'name' => "Men's Full-Zip Thermal Hoodie",
                'category' => 'Hoodies & Sweatshirts',
                'price_cents' => 13500,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Heather Grey', 'slug' => 'grey', 'hex' => '#9ca3af', 'inStock' => true],
                    ['name' => 'Pitch Black', 'slug' => 'black', 'hex' => '#0f172a', 'inStock' => true],
                    ['name' => 'Espresso Brown', 'slug' => 'espresso', 'hex' => '#451a03', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'men',
                'slug' => 'mens-sweatpants',
                'name' => "Men's Tailored Sweatpants",
                'category' => 'Pants',
                'price_cents' => 8900,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Graphite', 'slug' => 'graphite', 'hex' => '#374151', 'inStock' => true],
                    ['name' => 'Camel Tan', 'slug' => 'camel', 'hex' => '#d97706', 'inStock' => true],
                    ['name' => 'Nightfall', 'slug' => 'nightfall', 'hex' => '#111827', 'inStock' => true],
                ],
            ],

            // WOMEN (8 Products)
            [
                'gender' => 'women',
                'slug' => 'womens-dress-aline',
                'name' => "Women's A-Line Midi Dress",
                'category' => 'Dresses',
                'price_cents' => 14500,
                'customizable' => true,
                'colors' => [
                    ['name' => 'Crimson Red', 'slug' => 'crimson', 'hex' => '#991b1b', 'inStock' => true],
                    ['name' => 'Emerald', 'slug' => 'emerald', 'hex' => '#065f46', 'inStock' => true],
                    ['name' => 'Noir', 'slug' => 'black', 'hex' => '#18181b', 'inStock' => true],
                    ['name' => 'Blush Pink', 'slug' => 'blush', 'hex' => '#fb7185', 'inStock' => false],
                ],
            ],
            [
                'gender' => 'women',
                'slug' => 'womens-hoodie',
                'name' => "Women's Cropped Fleece Hoodie",
                'category' => 'Hoodies & Sweatshirts',
                'price_cents' => 11000,
                'customizable' => true,
                'colors' => [
                    ['name' => 'Alabaster Cream', 'slug' => 'cream', 'hex' => '#fef3c7', 'inStock' => true],
                    ['name' => 'Lilac', 'slug' => 'lavender', 'hex' => '#c084fc', 'inStock' => true],
                    ['name' => 'Deep Black', 'slug' => 'black', 'hex' => '#18181b', 'inStock' => true],
                    ['name' => 'Sage Green', 'slug' => 'sage', 'hex' => '#a3e635', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'women',
                'slug' => 'womens-tshirt',
                'name' => "Women's Ribbed Baby Tee",
                'category' => 'T-Shirts',
                'price_cents' => 4800,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Clean White', 'slug' => 'white', 'hex' => '#ffffff', 'inStock' => true],
                    ['name' => 'Butter Yellow', 'slug' => 'butter', 'hex' => '#fef08a', 'inStock' => true],
                    ['name' => 'Ink Black', 'slug' => 'black', 'hex' => '#111827', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'women',
                'slug' => 'womens-crewneck',
                'name' => "Women's Relaxed Fit Crewneck",
                'category' => 'Hoodies & Sweatshirts',
                'price_cents' => 9200,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Muted Rose', 'slug' => 'rose', 'hex' => '#fda4af', 'inStock' => true],
                    ['name' => 'Sky Slate', 'slug' => 'slate', 'hex' => '#64748b', 'inStock' => true],
                    ['name' => 'Vanilla Ice', 'slug' => 'vanilla', 'hex' => '#fafaf9', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'women',
                'slug' => 'womens-slip-dress',
                'name' => "Women's Silk Satin Slip Dress",
                'category' => 'Dresses',
                'price_cents' => 16800,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Champagne Gold', 'slug' => 'champagne', 'hex' => '#fde047', 'inStock' => true],
                    ['name' => 'Midnight Plum', 'slug' => 'plum', 'hex' => '#581c87', 'inStock' => true],
                    ['name' => 'Jet Black', 'slug' => 'black', 'hex' => '#030712', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'women',
                'slug' => 'womens-cardigan',
                'name' => "Women's Ribbed Knit Cardigan",
                'category' => 'Knitwear',
                'price_cents' => 13500,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Oatmeal Melange', 'slug' => 'oatmeal', 'hex' => '#e7e5e4', 'inStock' => true],
                    ['name' => 'Olive Grove', 'slug' => 'olive', 'hex' => '#4d7c0f', 'inStock' => true],
                    ['name' => 'Espresso', 'slug' => 'espresso', 'hex' => '#3b0764', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'women',
                'slug' => 'womens-blazer',
                'name' => "Women's Tailored Oversized Blazer",
                'category' => 'Jackets & Outerwear',
                'price_cents' => 21000,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Taupe Houndstooth', 'slug' => 'taupe', 'hex' => '#78716c', 'inStock' => true],
                    ['name' => 'Midnight Charcoal', 'slug' => 'charcoal', 'hex' => '#1f2937', 'inStock' => true],
                    ['name' => 'Ivory Cream', 'slug' => 'ivory', 'hex' => '#fffbeb', 'inStock' => true],
                ],
            ],
            [
                'gender' => 'women',
                'slug' => 'womens-joggers',
                'name' => "Women's High-Rise Fleece Joggers",
                'category' => 'Pants',
                'price_cents' => 8500,
                'customizable' => false,
                'colors' => [
                    ['name' => 'Cloud Grey', 'slug' => 'grey', 'hex' => '#d1d5db', 'inStock' => true],
                    ['name' => 'Dark Moss', 'slug' => 'moss', 'hex' => '#14532d', 'inStock' => true],
                    ['name' => 'Classic Black', 'slug' => 'black', 'hex' => '#09090b', 'inStock' => true],
                ],
            ],
        ];

        foreach ($catalog as $item) {
            $catSlug = Str::slug($item['category'].'-'.$item['gender']);
            $category = Category::firstOrCreate(
                ['slug' => $catSlug],
                [
                    'name' => $item['category'],
                    'gender' => $item['gender'],
                ]
            );

            $firstColor = $item['colors'][0];
            $thumbUrl = "/dev-models/{$item['gender']}/{$item['slug']}/{$firstColor['slug']}-thumb.webp";

            $product = Product::updateOrCreate(
                ['garment_slug' => $item['slug']],
                [
                    'category_id' => $category->id,
                    'name' => $item['name'],
                    'description' => "Luxury tailored {$item['name']} crafted from heavyweight organic materials with precision detailing.",
                    'price_cents' => $item['price_cents'],
                    'thumb_url' => $thumbUrl,
                    'customizable' => $item['customizable'],
                    'active' => true,
                ]
            );

            foreach ($item['colors'] as $c) {
                $sku = strtoupper("ZAV-{$item['slug']}-{$c['slug']}");
                $modelImageUrl = "/dev-models/{$item['gender']}/{$item['slug']}/{$c['slug']}.webp";

                ProductVariant::updateOrCreate(
                    ['sku' => $sku],
                    [
                        'product_id' => $product->id,
                        'color' => $c['name'],
                        'hex' => $c['hex'],
                        'model_image_url' => $modelImageUrl,
                        'stock' => $c['inStock'] ? 50 : 0,
                    ]
                );
            }
        }
    }
}
