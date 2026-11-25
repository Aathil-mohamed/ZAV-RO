<?php

namespace App\Jobs;

use App\Models\TryOnResult;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RunMyModelTryOn implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 120;

    public function __construct(
        public TryOnResult $result,
        public string $garmentUrl,
        public string $category = 'upper',
    ) {}

    public function handle(): void
    {
        $this->result->update(['status' => 'processing']);

        $person = Storage::disk('s3-private')->get($this->result->modelPhoto->path);
        $res = Http::withToken(config('services.tryon.token'))
            ->timeout(100)
            ->attach('person', $person, 'person.jpg')
            ->post(rtrim(config('services.tryon.url'), '/') . '/v1/tryon', [
                'garment_url' => $this->garmentUrl,
                'category' => $this->category,
            ]);

        if (! $res->successful()) {
            throw new \RuntimeException('Try-on service error ' . $res->status());
        }

        $path = 'tryon/results/' . Str::uuid() . '.png';
        Storage::disk('s3-private')->put($path, $res->body());

        $this->result->update(['status' => 'done', 'result_path' => $path]);
    }

    public function failed(\Throwable $e): void
    {
        $this->result->update([
            'status' => 'failed',
            'error' => 'We could not create the preview. Please try another photo.',
        ]);
    }
}
