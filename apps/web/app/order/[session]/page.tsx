"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/store/cart";

type OrderSummary = {
  id: number;
  status: string;
  email: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  trackingNumber: string | null;
  items: Array<{ id: number; name: string; size: string | null; qty: number; unitPriceCents: number }>;
};

export default function OrderConfirmationPage({ params }: { params: { session: string } }) {
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let active = true;

    const poll = async () => {
      try {
        const res = await api<OrderSummary>(`/api/orders/${params.session}`);
        if (!active) return;
        setOrder(res);
        if (res.status === "paid" || res.status === "in_production" || res.status === "shipped" || res.status === "delivered") {
          useCart.getState().clear();
          return;
        }
        timer = setTimeout(poll, 2000);
      } catch {
        if (active) setError("Could not load order details.");
      }
    };

    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [params.session]);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold mb-2">Order Confirmation</h1>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!order && !error && <p className="text-sm text-neutral-500">Confirming your payment…</p>}

      {order && (
        <div className="mt-6 space-y-6 rounded-2xl border p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Order #{order.id}</span>
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase text-white">
              {order.status}
            </span>
          </div>

          <p className="text-xs text-neutral-500">Confirmation sent to {order.email}</p>

          <ul className="divide-y text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between py-2">
                <span>
                  {it.name} {it.size ? `(${it.size})` : ""} × {it.qty}
                </span>
                <span className="font-medium">${((it.unitPriceCents * it.qty) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t pt-3 text-sm space-y-1">
            <div className="flex justify-between text-neutral-500">
              <span>Shipping</span>
              <span>{order.shippingCents === 0 ? "Free" : `$${(order.shippingCents / 100).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${(order.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          <Link href="/" className="inline-block rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase text-white">
            Continue shopping
          </Link>
        </div>
      )}
    </main>
  );
}
