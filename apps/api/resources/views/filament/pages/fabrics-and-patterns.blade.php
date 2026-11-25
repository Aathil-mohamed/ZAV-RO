<x-filament-panels::page>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-bold mb-2">Fabrics</h2>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        @foreach($fabrics as $id => $f)
          <div class="rounded border p-3 text-sm">
            <div class="font-semibold">{{ $f['label'] }}</div>
            <div class="text-xs text-gray-500">ID: {{ $id }}</div>
            <div class="text-xs">Roughness: {{ $f['roughness'] }}</div>
            <div class="text-xs">Delta: +${{ number_format(($f['priceDeltaCents'] ?? 0) / 100, 2) }}</div>
          </div>
        @endforeach
      </div>
    </div>

    <div>
      <h2 class="text-lg font-bold mb-2">Registered 3D Garments ({{ count($garments) }})</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        @foreach($garments as $g)
          <div class="rounded border p-3 text-sm">
            <div class="font-semibold">{{ $g['name'] }} ({{ ucfirst($g['gender']) }})</div>
            <div class="text-xs text-gray-500">{{ $g['slug'] }} · Base ${{ number_format($g['basePriceCents'] / 100, 2) }}</div>
            <div class="text-xs mt-1">{{ count($g['panels']) }} pattern pieces · {{ count($g['variants']) }} variant groups</div>
          </div>
        @endforeach
      </div>
    </div>
  </div>
</x-filament-panels::page>
