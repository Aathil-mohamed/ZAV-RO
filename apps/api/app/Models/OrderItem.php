<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_variant_id',
        'custom_design_id',
        'name',
        'size',
        'qty',
        'unit_price_cents',
        'production_pack_path',
    ];

    protected $casts = [
        'qty' => 'integer',
        'unit_price_cents' => 'integer',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function customDesign(): BelongsTo
    {
        return $this->belongsTo(CustomDesign::class);
    }
}
