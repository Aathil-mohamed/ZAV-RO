<?php

namespace App\Observers;

use Illuminate\Support\Facades\Cache;

class CatalogObserver
{
    /**
     * Bust catalog caches when products or variants change.
     */
    public function saved(): void
    {
        $this->bust();
    }

    public function deleted(): void
    {
        $this->bust();
    }

    public function restored(): void
    {
        $this->bust();
    }

    private function bust(): void
    {
        Cache::forget('catalog:men');
        Cache::forget('catalog:women');
    }
}
