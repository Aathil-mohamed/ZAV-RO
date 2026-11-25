<?php

namespace App\Filament\Resources\TryOnJobs\Pages;

use App\Filament\Resources\TryOnJobs\TryOnJobResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ManageRecords;

class ManageTryOnJobs extends ManageRecords
{
    protected static string $resource = TryOnJobResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
