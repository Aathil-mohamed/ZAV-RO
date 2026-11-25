<?php

namespace App\Filament\Resources\Orders\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('email')->email()->disabled(),
                Select::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'paid' => 'Paid',
                        'in_production' => 'In Production',
                        'shipped' => 'Shipped',
                        'delivered' => 'Delivered',
                        'cancelled' => 'Cancelled',
                    ])
                    ->required(),
                TextInput::make('tracking_number')->maxLength(120),
                TextInput::make('subtotal_cents')->numeric()->disabled(),
                TextInput::make('shipping_cents')->numeric()->disabled(),
                TextInput::make('total_cents')->numeric()->disabled(),
            ]);
    }
}
