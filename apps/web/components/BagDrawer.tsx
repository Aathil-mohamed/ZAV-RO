"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/money";
import { submitPayHereForm } from "@/lib/payhere";

export default function BagDrawer() {
  const { open, lines: rawLines, toggle, setQty, remove, subtotalCents } = useCart();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (user) {
      setEmail((e) => e || user.email);
      const parts = user.name.trim().split(/\s+/);
      setFirstName((f) => f || parts[0] || "");
      setLastName((l) => l || parts.slice(1).join(" ") || "");
    }
  }, [user]);

  const lines = mounted ? rawLines : [];
  const subtotal = mounted ? subtotalCents() : 0;
  const isLoggedIn = Boolean(user);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{
        orderNumber: string;
        viewToken: string;
        action: string;
        fields: Record<string, string>;
      }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          email,
          shipping: {
            first_name: firstName,
            last_name: lastName,
            phone,
            address,
            city,
          },
          items: lines.map((l) => ({
            variant_id: l.variantId ?? null,
            custom_design_id: l.customDesignId ?? null,
            size: l.size ?? null,
            qty: l.qty,
          })),
        }),
      });
      submitPayHereForm(res.action, res.fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <div
          onClick={() => toggle(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        aria-hidden={!open}
        aria-label="Your bag"
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(92vw,400px)] flex-col bg-white dark:bg-neutral-900 shadow-2xl transition-transform duration-300 ease-in-out border-l border-neutral-200 dark:border-neutral-800 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Your Bag
            </h2>
            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              {lines.reduce((total, item) => total + item.qty, 0)}
            </span>
          </div>
          <button
            onClick={() => toggle(false)}
            aria-label="Close bag"
            className="flex size-8 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            ✕
          </button>
        </header>

        <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? (
            <li className="flex flex-col items-center justify-center h-48 text-center text-sm text-neutral-500">
              Your bag is currently empty.
            </li>
          ) : (
            lines.map((l) => (
              <li
                key={l.key}
                className="flex gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800/80 last:border-none"
              >
                <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={l.image}
                    alt={l.name}
                    fill
                    sizes="72px"
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between py-0.5 text-sm">
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                      {l.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {l.size ? `Size ${l.size} · ` : ""}
                      {formatMoney(l.priceCents)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-800">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => setQty(l.key, l.qty - 1, isLoggedIn)}
                        className="flex size-6 items-center justify-center rounded text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {l.qty}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => setQty(l.key, l.qty + 1, isLoggedIn)}
                        className="flex size-6 items-center justify-center rounded text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => remove(l.key, isLoggedIn)}
                      className="text-xs text-neutral-400 hover:text-rose-500 transition-colors underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        <footer className="space-y-3 border-t border-neutral-200 dark:border-neutral-800 px-6 py-5 bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              {formatMoney(subtotal)}
            </span>
          </div>

          {!checkoutOpen ? (
            <button
              type="button"
              disabled={lines.length === 0}
              onClick={() => setCheckoutOpen(true)}
              className="w-full rounded-xl bg-neutral-900 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white dark:text-neutral-950"
            >
              Checkout
            </button>
          ) : (
            <form onSubmit={handleCheckout} className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="rounded border px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
                <input type="text" required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="rounded border px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
              </div>
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
              <input type="tel" required placeholder="Phone (e.g. 0771234567)" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded border px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
              <input type="text" required placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded border px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
              <input type="text" required placeholder="City (e.g. Colombo)" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded border px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-800" />
              {error && <p className="text-rose-600">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setCheckoutOpen(false)} className="rounded-lg border px-3 py-2.5 font-semibold dark:border-neutral-700">
                  Back
                </button>
                <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-black py-2.5 font-bold uppercase tracking-wider text-white disabled:opacity-50 dark:bg-white dark:text-black">
                  {busy ? "Redirecting…" : "Pay with PayHere"}
                </button>
              </div>
            </form>
          )}
        </footer>
      </aside>
    </>
  );
}
