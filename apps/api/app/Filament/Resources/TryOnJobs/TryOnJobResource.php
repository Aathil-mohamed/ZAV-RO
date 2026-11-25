<?php

namespace App\Filament\Resources\TryOnJobs;

use App\Filament\Resources\TryOnJobs\Pages\ManageTryOnJobs;
use App\Models\TryOnJob;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Storage;

class TryOnJobResource extends Resource
{
    protected static ?string $model = TryOnJob::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSparkles;

    public static function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('id', 'desc')
            ->columns([
                TextColumn::make('id')->sortable(),
                TextColumn::make('user.email')->label('User')->searchable(),
                TextColumn::make('category')->badge(),
                TextColumn::make('status')->badge()->sortable(),
                TextColumn::make('expires_at')->dateTime()->sortable(),
            ])
            ->recordActions([
                Action::make('delete_photos')
                    ->label('Delete photos')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(function (TryOnJob $record): void {
                        Storage::disk('s3-private')->delete(array_values(array_filter([
                            $record->input_path,
                            $record->result_path,
                        ])));
                        $record->delete();
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageTryOnJobs::route('/'),
        ];
    }
}
