<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMeasurement extends Model
{
    protected $fillable = [
        'user_id',
        'height_cm',
        'chest_cm',
        'waist_cm',
        'hip_cm',
    ];

    protected $casts = [
        'height_cm' => 'integer',
        'chest_cm' => 'integer',
        'waist_cm' => 'integer',
        'hip_cm' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
