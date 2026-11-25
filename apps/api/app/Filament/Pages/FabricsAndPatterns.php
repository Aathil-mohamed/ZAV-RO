<?php

namespace App\Filament\Pages;

use BackedEnum;
use Filament\Pages\Page;
use Filament\Support\Icons\Heroicon;

class FabricsAndPatterns extends Page
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static ?string $title = 'Fabrics & Patterns Registry';

    protected string $view = 'filament.pages.fabrics-and-patterns';

    public array $fabrics = [];

    public array $garments = [];

    public function mount(): void
    {
        $path = resource_path('registry.json');
        if (file_exists($path)) {
            $reg = json_decode(file_get_contents($path), true) ?: [];
            $this->fabrics = $reg['fabrics'] ?? [];
            $this->garments = $reg['garments'] ?? [];
        }
    }
}
