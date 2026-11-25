<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #111;">
  <h2>Your ZAVÉRO Order #{{ $order->id }} Has Shipped</h2>
  @if($order->tracking_number)
    <p>Tracking number: <strong>{{ $order->tracking_number }}</strong></p>
  @endif
  <p>Thank you for shopping with ZAVÉRO.</p>
</body>
</html>
