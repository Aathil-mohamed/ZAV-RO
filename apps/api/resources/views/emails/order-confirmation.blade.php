<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #111;">
  <h2>Thank you for your ZAVÉRO order #{{ $order->id }}</h2>
  <p>We have received your payment and are preparing your items.</p>
  <ul>
    @foreach($order->items as $item)
      <li>
        {{ $item->name }} @if($item->size)(Size {{ $item->size }})@endif × {{ $item->qty }} — ${{ number_format(($item->unit_price_cents * $item->qty) / 100, 2) }}
        @if($item->customDesign && $item->customDesign->preview_path)
          <br><img src="{{ rtrim(config('app.public_assets_url'), '/') . '/' . $item->customDesign->preview_path }}" alt="{{ $item->name }}" style="max-width:160px;margin-top:6px;">
        @endif
      </li>
    @endforeach
  </ul>
  <p><strong>Total: ${{ number_format($order->total_cents / 100, 2) }}</strong></p>
</body>
</html>
