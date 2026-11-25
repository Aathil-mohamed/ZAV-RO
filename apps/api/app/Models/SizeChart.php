<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SizeChart extends Model
{
    protected $fillable = [
        'gender',
        'garment_group',
        'size',
        'chest_cm',
        'waist_cm',
        'hip_cm',
    ];

    protected $casts = [
        'chest_cm' => 'integer',
        'waist_cm' => 'integer',
        'hip_cm' => 'integer',
    ];
}
