<?php

namespace App\Models;

use App\Observers\OrderObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[ObservedBy([OrderObserver::class])]
class Order extends Model
{
    protected $fillable = [
        'order_number',
        'view_token',
        'user_id',
        'email',
        'status',
        'payment_provider',
        'payment_ref',
        'payment_attempts',
        'subtotal_cents',
        'shipping_cents',
        'total_cents',
        'shipping_address',
        'tracking_number',
    ];

    protected $casts = [
        'subtotal_cents' => 'integer',
        'shipping_cents' => 'integer',
        'total_cents' => 'integer',
        'payment_attempts' => 'integer',
        'shipping_address' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Order $order): void {
            if (! $order->order_number) {
                $next = (static::max('id') ?? 0) + 1;
                $order->order_number = 'ORD-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT) . '-' . strtoupper(Str::random(3));
            }
            if (! $order->view_token) {
                $order->view_token = Str::random(40);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
