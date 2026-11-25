<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class TryOnPhotoValidator
{
    /**
     * Calls FastAPI /v1/validate-photo when TRYON_URL is configured.
     * Aborts with 422 if the service rejects the photo for quality/size/lighting.
     */
    public function validate(UploadedFile $file): void
    {
        $url = config('services.tryon.url');
        if (! $url) {
            return;
        }

        $res = Http::withToken(config('services.tryon.token'))
            ->timeout(15)
            ->attach('person', file_get_contents($file->getRealPath()), $file->getClientOriginalName() ?: 'person.jpg')
            ->post(rtrim($url, '/') . '/v1/validate-photo');

        if ($res->status() >= 400 && $res->status() < 500) {
            $msg = $res->json('detail') ?? 'Photo could not be validated. Please upload a clear full-body photo.';
            abort(422, $msg);
        }
    }
}
