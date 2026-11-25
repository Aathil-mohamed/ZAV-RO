<?php

namespace App\Http\Controllers;

use App\Jobs\RunTryOn;
use App\Models\TryOnJob;
use App\Services\TryOnPhotoValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TryOnController extends Controller
{
    public function store(Request $request, TryOnPhotoValidator $validator)
    {
        $allowedPrefix = rtrim(config('app.public_assets_url'), '/') . '/';

        $request->validate([
            'photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:10240|dimensions:min_width=400,min_height=600',
            'garment_url' => ['required', 'url', function ($attr, $value, $fail) use ($allowedPrefix) {
                if (! str_starts_with($value, $allowedPrefix)) {
                    $fail('Invalid garment image');
                }
            }],
            'category' => 'required|in:upper,lower,dress',
            'consent' => 'accepted',
        ]);

        $validator->validate($request->file('photo'));

        $path = $request->file('photo')->store('tryon/inputs', 's3-private');

        $job = TryOnJob::create([
            'user_id' => $request->user()->id,
            'input_path' => $path,
            'garment_url' => $request->garment_url,
            'category' => $request->category,
            'expires_at' => now()->addHours(24),
        ]);

        RunTryOn::dispatch($job);

        return response()->json(['id' => $job->id, 'status' => 'queued'], 202);
    }

    public function show(Request $request, int $id)
    {
        $job = TryOnJob::where('user_id', $request->user()->id)->findOrFail($id);

        return [
            'status' => $job->status,
            'error' => $job->error,
            'resultUrl' => $job->result_path
                ? Storage::disk('s3-private')->temporaryUrl($job->result_path, now()->addMinutes(10))
                : null,
        ];
    }

    public function destroyAll(Request $request)
    {
        TryOnJob::where('user_id', $request->user()->id)->get()->each(function (TryOnJob $job) {
            Storage::disk('s3-private')->delete(array_values(array_filter([$job->input_path, $job->result_path])));
            $job->delete();
        });

        return response()->noContent();
    }
}
