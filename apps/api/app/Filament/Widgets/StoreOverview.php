<?php

namespace App\Filament\Widgets;

use App\Models\Order;
use App\Models\OrderItem;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StoreOverview extends BaseWidget
{
    protected function getStats(): array
    {
        $paidStatuses = ['paid', 'in_production', 'shipped', 'delivered'];
        $revenueCents = (int) Order::whereIn('status', $paidStatuses)->sum('total_cents');
        $ordersToday = Order::whereDate('created_at', today())->count();

        $totalItems = OrderItem::count();
        $customItems = OrderItem::whereNotNull('custom_design_id')->count();
        $customShare = $totalItems > 0 ? round(($customItems / $totalItems) * 100) : 0;

        $topItem = OrderItem::selectRaw('name, sum(qty) as total_qty')
            ->groupBy('name')
            ->orderByDesc('total_qty')
            ->first();

        return [
            Stat::make('Total Revenue', '$' . number_format($revenueCents / 100, 2)),
            Stat::make('Orders Today', (string) $ordersToday),
            Stat::make('Top Garment', $topItem ? "{$topItem->name} ({$topItem->total_qty})" : 'No orders yet'),
            Stat::make('Custom Design Share', "{$customShare}%"),
        ];
    }
}
