"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useCart } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import { submitPayHereForm } from "@/lib/payhere";

type OrderSummary = {
  id: number;
  orderNumber: string;
  status: string;
  email: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  trackingNumber: string | null;
  items: Array<{ id: number; name: string; size: string | null; qty: number; unitPriceCents: number }>;
};

export default function OrderConfirmationPage({ params }: { params: { orderNumber: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let active = true;
    const t0 = Date.now();

    const poll = async () => {
      try {
        const qs = token ? `?token=${encodeURIComponent(token)}` : "";
        const res = await api<OrderSummary>(`/api/orders/${encodeURIComponent(params.orderNumber)}${qs}`);
        if (!active) return;
        setOrder(res);
        if (["paid", "in_production", "shipped", "delivered"].includes(res.status)) {
          useCart.getState().clear();
          return;
        }
        if (Date.now() - t0 >= 60_000) {
          setTimedOut(true);
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
  }, [params.orderNumber, token]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await api<{ action: string; fields: Record<string, string> }>(
        `/api/orders/${encodeURIComponent(params.orderNumber)}/pay${qs}`,
        { method: "POST" }
      );
      submitPayHereForm(res.action, res.fields);
    } catch {
      setError("Could not restart payment.");
      setRetrying(false);
    }
  };

  const isPaid = order && ["paid", "in_production", "shipped", "delivered"].includes(order.status);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold mb-2">Order Status</h1>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {!order && !error && <p className="text-sm text-neutral-500">Confirming your payment…</p>}

      {order && (
        <div className="mt-6 space-y-6 rounded-2xl border p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{order.orderNumber}</span>
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase text-white">
              {isPaid ? "Paid" : timedOut ? "Payment not completed" : "Confirming your payment…"}
            </span>
          </div>

          <p className="text-xs text-neutral-500">Order email: {order.email}</p>

          <ul className="divide-y text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between py-2">
                <span>
                  {it.name} {it.size ? `(${it.size})` : ""} × {it.qty}
                </span>
                <span className="font-medium">{formatMoney(it.unitPriceCents * it.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="border-t pt-3 text-sm space-y-1">
            <div className="flex justify-between text-neutral-500">
              <span>Shipping</span>
              <span>{order.shippingCents === 0 ? "Free" : formatMoney(order.shippingCents)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>{formatMoney(order.totalCents)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isPaid && order.status === "pending" && (
              <button
                type="button"
                disabled={retrying}
                onClick={handleRetry}
                className="rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase text-white disabled:opacity-50"
              >
                {retrying ? "Redirecting…" : "Try again"}
              </button>
            )}
            <Link href="/" className="rounded-lg border px-4 py-2 text-xs font-semibold uppercase">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
