<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),
                TextInput::make('name')->required()->maxLength(200),
                Textarea::make('description')->columnSpanFull(),
                TextInput::make('price_cents')->numeric()->required()->minValue(0),
                FileUpload::make('thumb_url')
                    ->label('Thumbnail Image')
                    ->disk('s3-public')
                    ->directory('products')
                    ->image(),
                Toggle::make('customizable')->default(false),
                TextInput::make('garment_slug')->maxLength(100),
                Select::make('size_group')
                    ->options(['upper' => 'Upper', 'lower' => 'Lower', 'dress' => 'Dress'])
                    ->default('upper')
                    ->required(),
                Toggle::make('active')->default(true),
                Repeater::make('variants')
                    ->relationship()
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('color')->required(),
                        TextInput::make('hex')->required()->default('#000000'),
                        FileUpload::make('model_image_url')
                            ->label('Model Image')
                            ->disk('s3-public')
                            ->directory('variants')
                            ->image()
                            ->required(),
                        FileUpload::make('tryon_image_url')
                            ->label('Try-On Flat Image')
                            ->disk('s3-public')
                            ->directory('variants-tryon')
                            ->image(),
                        TextInput::make('sku')->required(),
                        TextInput::make('stock')->numeric()->default(10)->minValue(0)->required(),
                    ])
                    ->columns(2),
            ]);
    }
}
