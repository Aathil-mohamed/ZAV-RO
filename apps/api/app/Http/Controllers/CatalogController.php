<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;

class CatalogController extends Controller
{
    public function index(string $gender)
    {
        return Cache::remember("catalog:$gender", 300, fn () => Product::query()
            ->where('active', true)
            ->whereHas('category', fn ($q) => $q->whereIn('gender', [$gender, 'unisex']))
            ->with('variants:id,product_id,color,hex,model_image_url,stock')
            ->orderBy('id')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'priceCents' => (int) $p->price_cents,
                'thumb' => $p->thumb_url,
                'customizable' => (bool) $p->customizable,
                'garmentSlug' => $p->garment_slug,
                'variants' => $p->variants->map(fn ($v) => [
                    'id' => $v->id,
                    'color' => $v->color,
                    'hex' => $v->hex,
                    'modelImage' => $v->model_image_url,
                    'inStock' => $v->stock > 0,
                ])->values(),
            ])->values()
        );
    }
}
