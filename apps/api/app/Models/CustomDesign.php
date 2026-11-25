<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomDesign extends Model
{
    protected $fillable = [
        'user_id',
        'guest_token',
        'garment_slug',
        'design',
        'size',
        'price_cents',
        'preview_path',
        'share_token',
    ];

    protected $casts = [
        'design' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
