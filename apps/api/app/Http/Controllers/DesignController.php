<?php

namespace App\Http\Controllers;

use App\Models\CustomDesign;
use App\Services\DesignPricer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DesignController extends Controller
{
    public function store(Request $request, DesignPricer $pricer): array
    {
        $data = $request->validate([
            'garment_slug'                      => 'required|string',
            'size'                              => 'nullable|in:XS,S,M,L,XL,XXL',
            'design.panels'                     => 'required|array|max:20',
            'design.panels.*.fill'              => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'design.panels.*.fabric'            => 'required|string',
            'design.panels.*.layers'            => 'present|array|max:20',
            'design.panels.*.layers.*.type'     => 'required|in:pattern,image,text',
            'design.panels.*.layers.*.id'       => 'nullable|string|max:64',
            'design.panels.*.layers.*.src'      => 'nullable|string|max:500',
            'design.panels.*.layers.*.text'     => 'nullable|string|max:60',
            'design.panels.*.layers.*.font'     => 'nullable|string|max:100',
            'design.panels.*.layers.*.color'    => 'nullable|string|max:32',
            'design.panels.*.layers.*.patternId'=> 'nullable|string|max:64',
            'design.panels.*.layers.*.x'        => 'nullable|numeric',
            'design.panels.*.layers.*.y'        => 'nullable|numeric',
            'design.panels.*.layers.*.w'        => 'nullable|numeric',
            'design.panels.*.layers.*.tile'     => 'nullable|numeric',
            'design.panels.*.layers.*.size'     => 'nullable|numeric',
            'design.panels.*.layers.*.rotation' => 'nullable|numeric',
            'design.panels.*.layers.*.opacity'  => 'nullable|numeric',
            'design.variants'                   => 'present|array',
            'preview_png'                       => 'nullable|string|max:3000000',
        ]);

        $pricer->validate($data['garment_slug'], $data['design']);

        $previewPath = null;
        if (!empty($data['preview_png']) && preg_match('#^data:image/png;base64,(.+)$#s', $data['preview_png'], $m)) {
            $bin = base64_decode($m[1], true);
            $imageInfo = $bin ? @getimagesizefromstring($bin) : false;
            abort_unless($bin && $imageInfo && strlen($bin) < 2_000_000, 422, 'Bad preview image');

            $previewPath = 'previews/' . Str::uuid() . '.png';
            Storage::disk('s3-public')->put($previewPath, $bin, 'public');
        }

        $guestToken = null;
        if (! $request->user()) {
            $guestToken = $request->cookie('guest') ?? Str::random(40);
            Cookie::queue('guest', $guestToken, 60 * 24 * 30);
        }

        $design = CustomDesign::create([
            'user_id'      => $request->user()?->id,
            'guest_token'  => $guestToken,
            'garment_slug' => $data['garment_slug'],
            'design'       => $data['design'],
            'size'         => $data['size'] ?? null,
            'price_cents'  => $pricer->price($data['garment_slug'], $data['design']),
            'preview_path' => $previewPath,
            'share_token'  => Str::random(32),
        ]);

        return [
            'id'         => $design->id,
            'priceCents' => $design->price_cents,
            'shareToken' => $design->share_token,
            'previewUrl' => $previewPath
                ? rtrim(config('app.public_assets_url'), '/') . '/' . $previewPath
                : null,
        ];
    }

    /**
     * Public read of a design via its unguessable share token.
     */
    public function show(string $token): array
    {
        $design = CustomDesign::where('share_token', $token)->firstOrFail();

        return [
            'garmentSlug' => $design->garment_slug,
            'design'      => $design->design,
            'priceCents'  => $design->price_cents,
        ];
    }
}
