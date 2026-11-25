<?php

namespace App\Jobs;

use App\Models\TryOnJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class RunTryOn implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 120;

    public function __construct(public TryOnJob $tryOnJob) {}

    public function handle(): void
    {
        $this->tryOnJob->update(['status' => 'processing']);

        $person = Storage::disk('s3-private')->get($this->tryOnJob->input_path);
        $res = Http::withToken(config('services.tryon.token'))
            ->timeout(100)
            ->attach('person', $person, 'person.jpg')
            ->post(rtrim(config('services.tryon.url'), '/') . '/v1/tryon', [
                'garment_url' => $this->tryOnJob->garment_url,
                'category' => $this->tryOnJob->category,
            ]);

        if (! $res->successful()) {
            throw new \RuntimeException('Try-on service error ' . $res->status());
        }

        $path = 'tryon/results/' . Str::uuid() . '.png';
        Storage::disk('s3-private')->put($path, $res->body());

        $this->tryOnJob->update(['status' => 'done', 'result_path' => $path]);
    }

    public function failed(\Throwable $e): void
    {
        $this->tryOnJob->update([
            'status' => 'failed',
            'error' => 'We could not create the preview. Please try another photo.',
        ]);
    }
}
