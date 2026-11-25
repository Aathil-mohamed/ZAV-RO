<?php

namespace App\Console\Commands;

use App\Models\ModelPhoto;
use App\Models\TryOnJob;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeExpiredTryOns extends Command
{
    protected $signature = 'tryon:purge';

    protected $description = 'Delete expired try-on jobs, model photos, and associated private files';

    public function handle(): int
    {
        $jobsCount = 0;
        TryOnJob::where('expires_at', '<=', now())->each(function (TryOnJob $job) use (&$jobsCount) {
            Storage::disk('s3-private')->delete(array_values(array_filter([$job->input_path, $job->result_path])));
            $job->delete();
            $jobsCount++;
        });

        $modelsCount = 0;
        ModelPhoto::where('expires_at', '<=', now())->each(function (ModelPhoto $photo) use (&$modelsCount) {
            $paths = array_merge([$photo->path], $photo->results()->pluck('result_path')->filter()->all());
            Storage::disk('s3-private')->delete($paths);
            $photo->delete();
            $modelsCount++;
        });

        $this->info("Purged {$jobsCount} try-on job(s) and {$modelsCount} model photo(s).");

        return self::SUCCESS;
    }
}
