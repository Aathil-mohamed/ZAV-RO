<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CustomDesign;
use App\Models\ProductVariant;
use App\Services\DesignPricer;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request, DesignPricer $pricer): array
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);

        return ['lines' => $this->formatLines($cart, $pricer)];
    }

    public function merge(Request $request, DesignPricer $pricer): array
    {
        $data = $request->validate([
            'lines' => 'present|array|max:30',
            'lines.*.variantId' => 'nullable|integer',
            'lines.*.customDesignId' => 'nullable|integer',
            'lines.*.size' => 'nullable|in:XS,S,M,L,XL,XXL',
            'lines.*.qty' => 'required|integer|min:1',
        ]);

        $user = $request->user();
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        foreach ($data['lines'] as $line) {
            $qty = min(10, max(1, (int) $line['qty']));
            $variantId = $line['variantId'] ?? null;
            $designId = $line['customDesignId'] ?? null;

            abort_unless((! empty($variantId)) xor (! empty($designId)), 422, 'Each line needs a variantId or customDesignId');

            if ($variantId) {
                $variant = ProductVariant::with('product')->find($variantId);
                abort_unless($variant && $variant->product && $variant->product->active, 422, 'Unknown or inactive product variant');

                $existing = CartItem::where('cart_id', $cart->id)
                    ->where('product_variant_id', $variantId)
                    ->where('size', $line['size'] ?? null)
                    ->first();

                if ($existing) {
                    $existing->update(['qty' => min(10, $existing->qty + $qty)]);
                } else {
                    CartItem::create([
                        'cart_id' => $cart->id,
                        'product_variant_id' => $variantId,
                        'size' => $line['size'] ?? null,
                        'qty' => $qty,
                    ]);
                }
            } else {
                $design = CustomDesign::find($designId);
                abort_unless($design, 422, 'Unknown custom design');

                $existing = CartItem::where('cart_id', $cart->id)
                    ->where('custom_design_id', $designId)
                    ->where('size', $line['size'] ?? null)
                    ->first();

                if ($existing) {
                    $existing->update(['qty' => min(10, $existing->qty + $qty)]);
                } else {
                    CartItem::create([
                        'cart_id' => $cart->id,
                        'custom_design_id' => $designId,
                        'size' => $line['size'] ?? null,
                        'qty' => $qty,
                    ]);
                }
            }
        }

        return ['lines' => $this->formatLines($cart, $pricer)];
    }

    public function updateItem(Request $request, int $id, DesignPricer $pricer): array
    {
        $data = $request->validate(['qty' => 'required|integer|between:1,10']);
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);
        $item = CartItem::where('cart_id', $cart->id)->findOrFail($id);
        $item->update(['qty' => $data['qty']]);

        return ['lines' => $this->formatLines($cart, $pricer)];
    }

    public function destroyItem(Request $request, int $id, DesignPricer $pricer): array
    {
        $cart = Cart::firstOrCreate(['user_id' => $request->user()->id]);
        CartItem::where('cart_id', $cart->id)->whereKey($id)->delete();

        return ['lines' => $this->formatLines($cart, $pricer)];
    }

    private function formatLines(Cart $cart, DesignPricer $pricer): array
    {
        $items = $cart->items()->with(['productVariant.product', 'customDesign'])->get();
        $out = [];

        foreach ($items as $item) {
            if ($item->productVariant && $item->productVariant->product) {
                $v = $item->productVariant;
                $p = $v->product;
                $out[] = [
                    'id' => $item->id,
                    'key' => "{$v->id}-" . ($item->size ?? ''),
                    'name' => "{$p->name} ({$v->color})",
                    'image' => $v->model_image_url,
                    'priceCents' => (int) $p->price_cents,
                    'qty' => (int) $item->qty,
                    'size' => $item->size,
                    'variantId' => $v->id,
                ];
            } elseif ($item->customDesign) {
                $d = $item->customDesign;
                $garmentName = $pricer->garment($d->garment_slug)['name'] ?? $d->garment_slug;
                $out[] = [
                    'id' => $item->id,
                    'key' => "d{$d->id}-" . ($item->size ?? ''),
                    'name' => "Custom {$garmentName}",
                    'image' => $d->preview_path
                        ? rtrim(config('app.public_assets_url'), '/') . '/' . $d->preview_path
                        : '/branding/zavero-icon-192.png',
                    'priceCents' => (int) $d->price_cents,
                    'qty' => (int) $item->qty,
                    'size' => $item->size,
                    'customDesignId' => $d->id,
                ];
            }
        }

        return $out;
    }
}
