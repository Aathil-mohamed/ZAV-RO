<?php

namespace App\Filament\Resources\CustomDesigns;

use App\Filament\Resources\CustomDesigns\Pages\ManageCustomDesigns;
use App\Models\CustomDesign;
use BackedEnum;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CustomDesignResource extends Resource
{
    protected static ?string $model = CustomDesign::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPaintBrush;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('garment_slug')->disabled(),
                TextInput::make('size')->disabled(),
                TextInput::make('price_cents')->disabled(),
                TextInput::make('share_token')->disabled(),
                Textarea::make('design')
                    ->formatStateUsing(fn ($state): string => json_encode($state, JSON_PRETTY_PRINT))
                    ->rows(10)
                    ->columnSpanFull()
                    ->disabled(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('id', 'desc')
            ->columns([
                TextColumn::make('id')->sortable(),
                TextColumn::make('garment_slug')->searchable()->sortable(),
                TextColumn::make('size')->placeholder('—'),
                TextColumn::make('price_cents')
                    ->label('Price')
                    ->formatStateUsing(fn (int $state): string => '$' . number_format($state / 100, 2)),
                TextColumn::make('share_token')->copyable(),
                TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->recordActions([
                EditAction::make()->label('View'),
                DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageCustomDesigns::route('/'),
        ];
    }
}
