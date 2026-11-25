<?php

namespace App\Filament\Resources\CustomDesigns\Pages;

use App\Filament\Resources\CustomDesigns\CustomDesignResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ManageRecords;

class ManageCustomDesigns extends ManageRecords
{
    protected static string $resource = CustomDesignResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
