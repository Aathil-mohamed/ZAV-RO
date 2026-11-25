<?php

namespace App\Models;

use App\Observers\OrderObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[ObservedBy([OrderObserver::class])]
class Order extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'status',
        'subtotal_cents',
        'shipping_cents',
        'total_cents',
        'stripe_session_id',
        'shipping_address',
        'tracking_number',
    ];

    protected $casts = [
        'subtotal_cents' => 'integer',
        'shipping_cents' => 'integer',
        'total_cents' => 'integer',
        'shipping_address' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
