<?php

namespace App\Filament\Resources\Orders\Tables;

use App\Models\Order;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Storage;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('id', 'desc')
            ->columns([
                TextColumn::make('id')->label('#')->sortable(),
                TextColumn::make('email')->searchable(),
                TextColumn::make('status')->badge()->sortable(),
                TextColumn::make('total_cents')
                    ->label('Total')
                    ->formatStateUsing(fn (int $state): string => '$' . number_format($state / 100, 2))
                    ->sortable(),
                TextColumn::make('tracking_number')->placeholder('—'),
                TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
                Action::make('download_pack')
                    ->label('Production Pack')
                    ->visible(fn (Order $record): bool => $record->items()->whereNotNull('production_pack_path')->exists())
                    ->action(function (Order $record) {
                        $item = $record->items()->whereNotNull('production_pack_path')->first();
                        if ($item && Storage::disk('s3-private')->exists($item->production_pack_path)) {
                            return Storage::disk('s3-private')->download($item->production_pack_path);
                        }
                        return null;
                    }),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
