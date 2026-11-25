<?php

namespace App\Services;

class DesignPricer
{
    private array $reg;

    public function __construct()
    {
        $this->reg = json_decode(file_get_contents(resource_path('registry.json')), true);
    }

    public function garment(string $slug): array
    {
        foreach ($this->reg['garments'] as $g) {
            if ($g['slug'] === $slug) {
                return $g;
            }
        }
        abort(422, 'Unknown garment');
    }

    /**
     * Throws a 422 on anything not in the registry.
     */
    public function validate(string $slug, array $design): void
    {
        $g = $this->garment($slug);
        $ids = array_column($g['panels'], 'id');

        foreach ($design['panels'] as $id => $panel) {
            abort_unless(in_array($id, $ids, true), 422, "Unknown piece $id");
            abort_unless(isset($this->reg['fabrics'][$panel['fabric']]), 422, 'Unknown fabric');

            foreach ($panel['layers'] as $l) {
                if ($l['type'] === 'image') {
                    $allowed = rtrim(config('app.public_assets_url'), '/') . '/uploads/';
                    abort_unless(str_starts_with($l['src'] ?? '', $allowed), 422, 'Image must be uploaded through the site');
                }
                if ($l['type'] === 'text') {
                    abort_unless(mb_strlen($l['text'] ?? '') <= 60, 422, 'Text too long');
                }
            }
        }

        foreach ($design['variants'] as $key => $opt) {
            $grp = collect($g['variants'])->firstWhere('key', $key);
            abort_unless($grp && collect($grp['options'])->contains('id', $opt), 422, 'Invalid option');
        }
    }

    public function price(string $slug, array $design): int
    {
        $g = $this->garment($slug);
        $total = $g['basePriceCents'];

        foreach ($g['variants'] as $grp) {
            $chosen = $design['variants'][$grp['key']] ?? $grp['options'][0]['id'];
            foreach ($grp['options'] as $o) {
                if ($o['id'] === $chosen) {
                    $total += $o['priceDeltaCents'];
                }
            }
        }

        foreach (collect($design['panels'])->pluck('fabric')->unique() as $f) {
            $total += $this->reg['fabrics'][$f]['priceDeltaCents'] ?? 0;
        }

        $printed = collect($design['panels'])->filter(fn ($p) => count($p['layers']) > 0)->count();

        return $total + min($printed * 60000, 300000);
    }
}
