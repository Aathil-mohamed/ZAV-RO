<?php

namespace App\Http\Controllers;

use App\Jobs\RunMyModelTryOn;
use App\Models\CustomDesign;
use App\Models\ModelPhoto;
use App\Models\ProductVariant;
use App\Models\TryOnResult;
use App\Services\DesignPricer;
use App\Services\TryOnPhotoValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MyModelController extends Controller
{
    public function storePhoto(Request $request, TryOnPhotoValidator $validator)
    {
        $data = $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:10240|dimensions:min_width=400,min_height=600',
            'consent' => 'accepted',
            'keep_days' => 'nullable|in:1,30',
        ]);

        $validator->validate($request->file('photo'));

        $user = $request->user();
        $existing = $user->modelPhoto()->first();
        if ($existing) {
            $oldPaths = array_merge([$existing->path], $existing->results()->pluck('result_path')->filter()->all());
            Storage::disk('s3-private')->delete($oldPaths);
            $existing->delete();
        }

        $path = $request->file('photo')->store('tryon/models', 's3-private');
        $keepDays = (int) ($data['keep_days'] ?? 30);

        $photo = ModelPhoto::create([
            'user_id' => $user->id,
            'path' => $path,
            'consented_at' => now(),
            'expires_at' => now()->addDays($keepDays),
        ]);

        return response()->json([
            'hasPhoto' => true,
            'expiresAt' => $photo->expires_at->toIso8601String(),
            'remainingToday' => $this->remainingQuota($user->id),
        ], 201);
    }

    public function show(Request $request)
    {
        $user = $request->user();
        $photo = $user->modelPhoto()->first();
        $active = $photo && $photo->expires_at->isFuture();

        return [
            'hasPhoto' => $active,
            'expiresAt' => $active ? $photo->expires_at->toIso8601String() : null,
            'remainingToday' => $this->remainingQuota($user->id),
        ];
    }

    public function destroy(Request $request)
    {
        $photo = $request->user()->modelPhoto()->first();
        if ($photo) {
            $paths = array_merge([$photo->path], $photo->results()->pluck('result_path')->filter()->all());
            Storage::disk('s3-private')->delete($paths);
            $photo->delete();
        }

        return response()->noContent();
    }

    public function request(Request $request, DesignPricer $pricer)
    {
        $data = $request->validate([
            'variant_ids' => 'nullable|array|max:3',
            'variant_ids.*' => 'integer|exists:product_variants,id',
            'custom_design_id' => 'nullable|integer|exists:custom_designs,id',
        ]);

        $user = $request->user();
        $photo = $user->modelPhoto()->first();
        abort_unless($photo && $photo->expires_at->isFuture(), 422, 'Upload a model photo first.');

        $limit = config('tryon.daily_limit', 20);
        $usedToday = $this->usedToday($user->id);

        $results = [];

        if (! empty($data['custom_design_id'])) {
            $design = CustomDesign::findOrFail($data['custom_design_id']);
            abort_unless($design->preview_path, 422, 'Custom design has no preview image.');

            $row = TryOnResult::where('model_photo_id', $photo->id)
                ->where('custom_design_id', $design->id)
                ->first();

            if (! $row) {
                if ($usedToday >= $limit) {
                    return response()->json([
                        'message' => "You have used today's tries.",
                        'remaining' => 0,
                        'results' => [],
                    ], 429);
                }
                $row = TryOnResult::create([
                    'model_photo_id' => $photo->id,
                    'custom_design_id' => $design->id,
                    'status' => 'queued',
                ]);
                $usedToday++;
                $garmentUrl = rtrim(config('app.public_assets_url'), '/') . '/' . $design->preview_path;
                $category = $this->categoryForSlug($design->garment_slug);
                RunMyModelTryOn::dispatch($row, $garmentUrl, $category);
            }

            $results[] = $this->formatResult($row);
            return [
                'results' => $results,
                'remaining' => max(0, $limit - $usedToday),
            ];
        }

        $variantIds = $data['variant_ids'] ?? [];
        $variants = ProductVariant::with('product.category')
            ->whereIn('id', $variantIds)
            ->whereHas('product', fn ($q) => $q->where('active', true))
            ->get()
            ->keyBy('id');

        $quotaHit = false;
        foreach ($variantIds as $vid) {
            $variant = $variants->get($vid);
            if (! $variant) {
                continue;
            }
            $row = TryOnResult::where('model_photo_id', $photo->id)
                ->where('product_variant_id', $vid)
                ->first();

            if (! $row) {
                if ($usedToday >= $limit) {
                    $quotaHit = true;
                    continue;
                }
                $row = TryOnResult::create([
                    'model_photo_id' => $photo->id,
                    'product_variant_id' => $vid,
                    'status' => 'queued',
                ]);
                $usedToday++;
                $rawUrl = $variant->tryon_image_url ?? $variant->model_image_url;
                $garmentUrl = str_starts_with($rawUrl, 'http')
                    ? $rawUrl
                    : rtrim(config('app.public_assets_url'), '/') . '/' . ltrim($rawUrl, '/');
                $category = $variant->product->size_group ?? 'upper';
                if (! in_array($category, ['upper', 'lower', 'dress'], true)) {
                    $category = 'upper';
                }
                RunMyModelTryOn::dispatch($row, $garmentUrl, $category);
            }

            $results[] = $this->formatResult($row);
        }

        if ($quotaHit && count($results) === 0) {
            return response()->json([
                'message' => "You have used today's tries.",
                'remaining' => 0,
                'results' => $results,
            ], 429);
        }

        return response()->json([
            'results' => $results,
            'remaining' => max(0, $limit - $usedToday),
        ], $quotaHit ? 429 : 200);
    }

    public function statuses(Request $request)
    {
        $photo = $request->user()->modelPhoto()->first();
        if (! $photo) {
            return [];
        }

        $ids = array_filter(array_map('intval', explode(',', (string) $request->query('variant_ids', ''))));
        if (! $ids) {
            return [];
        }

        return TryOnResult::where('model_photo_id', $photo->id)
            ->whereIn('product_variant_id', $ids)
            ->get()
            ->map(fn (TryOnResult $r) => $this->formatResult($r))
            ->values();
    }

    private function formatResult(TryOnResult $r): array
    {
        return [
            'variantId' => $r->product_variant_id,
            'customDesignId' => $r->custom_design_id,
            'status' => $r->status,
            'url' => $r->result_path
                ? Storage::disk('s3-private')->temporaryUrl($r->result_path, now()->addMinutes(10))
                : null,
        ];
    }

    private function usedToday(int $userId): int
    {
        return TryOnResult::whereHas('modelPhoto', fn ($q) => $q->where('user_id', $userId))
            ->where('created_at', '>=', now()->startOfDay())
            ->count();
    }

    private function remainingQuota(int $userId): int
    {
        return max(0, config('tryon.daily_limit', 20) - $this->usedToday($userId));
    }

    private function categoryForSlug(string $slug): string
    {
        if (str_contains($slug, 'dress') || str_contains($slug, 'gown') || str_contains($slug, 'jumpsuit')) {
            return 'dress';
        }
        if (str_contains($slug, 'trouser') || str_contains($slug, 'skirt') || str_contains($slug, 'shorts')) {
            return 'lower';
        }
        return 'upper';
    }
}
