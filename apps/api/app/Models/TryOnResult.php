<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TryOnResult extends Model
{
    protected $table = 'tryon_results';

    protected $fillable = [
        'model_photo_id',
        'product_variant_id',
        'custom_design_id',
        'status',
        'result_path',
        'error',
    ];

    public function modelPhoto(): BelongsTo
    {
        return $this->belongsTo(ModelPhoto::class);
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
