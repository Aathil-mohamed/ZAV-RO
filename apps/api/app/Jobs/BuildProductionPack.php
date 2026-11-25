<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class BuildProductionPack implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 180;

    public function __construct(
        public Order $order,
        public OrderItem $item,
    ) {}

    public function handle(): void
    {
        $design = $this->item->customDesign;
        if (! $design) {
            return;
        }

        $tmpDir = storage_path("app/tmp/pack-{$this->order->id}-{$this->item->id}");
        File::ensureDirectoryExists($tmpDir);

        try {
            $designJsonPath = $tmpDir . DIRECTORY_SEPARATOR . 'design.json';
            File::put($designJsonPath, json_encode([
                'garment_slug' => $design->garment_slug,
                'size' => $this->item->size,
                'design' => $design->design,
            ], JSON_PRETTY_PRINT));

            $addr = $this->order->shipping_address ?? [];
            $orderTxt = implode("\n", [
                "Order #{$this->order->id}",
                "Email: {$this->order->email}",
                "Item: {$this->item->name} (Size: " . ($this->item->size ?? 'N/A') . ", Qty: {$this->item->qty})",
                'Name: ' . ($addr['name'] ?? ''),
                'Address: ' . ($addr['line1'] ?? '') . ', ' . ($addr['city'] ?? '') . ' ' . ($addr['postal_code'] ?? '') . ' ' . ($addr['country'] ?? ''),
                'Variants: ' . json_encode($design->design['variants'] ?? []),
            ]);
            File::put($tmpDir . DIRECTORY_SEPARATOR . 'order.txt', $orderTxt);

            if ($design->preview_path && Storage::disk('s3-public')->exists($design->preview_path)) {
                File::put($tmpDir . DIRECTORY_SEPARATOR . 'preview.png', Storage::disk('s3-public')->get($design->preview_path));
            }

            $repoRoot = realpath(base_path('../..'));
            $script = $repoRoot . DIRECTORY_SEPARATOR . 'scripts' . DIRECTORY_SEPARATOR . 'render-pack.mjs';
            if (file_exists($script)) {
                Process::path($repoRoot)->run([
                    'node',
                    $script,
                    $designJsonPath,
                    $tmpDir,
                ]);
            }

            $zipPath = $tmpDir . DIRECTORY_SEPARATOR . 'pack.zip';
            $zip = new ZipArchive();
            if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
                foreach (File::files($tmpDir) as $file) {
                    if ($file->getFilename() !== 'pack.zip') {
                        $zip->addFile($file->getRealPath(), $file->getFilename());
                    }
                }
                $zip->close();

                $storagePath = "production/order-{$this->order->id}-item-{$this->item->id}.zip";
                Storage::disk('s3-private')->put($storagePath, File::get($zipPath));
                $this->item->update(['production_pack_path' => $storagePath]);
            }
        } finally {
            File::deleteDirectory($tmpDir);
        }
    }
}
