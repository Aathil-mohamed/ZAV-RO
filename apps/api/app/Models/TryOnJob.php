<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TryOnJob extends Model
{
    protected $fillable = [
        'user_id',
        'input_path',
        'garment_url',
        'category',
        'result_path',
        'status',
        'error',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
