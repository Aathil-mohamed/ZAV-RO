<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Accept image uploads (PNG, JPG, WebP – never SVG).
     * Server re-validates the binary so a spoofed MIME header won't sneak through.
     */
    public function store(Request $request): array
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ]);

        $realPath = $request->file('file')->getRealPath();
        // Double-check with PHP's image detection (independent of MIME header)
        abort_unless(@getimagesize($realPath) !== false, 422, 'Not a valid image');

        $ext  = $request->file('file')->extension();
        $name = Str::uuid() . '.' . $ext;

        Storage::disk('s3-public')->putFileAs('uploads', $request->file('file'), $name, 'public');

        return ['url' => rtrim(config('app.public_assets_url'), '/') . '/uploads/' . $name];
    }
}
