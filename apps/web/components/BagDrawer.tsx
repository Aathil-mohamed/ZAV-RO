"use client";

import Image from "next/image";
import { useCart } from "@/store/cart";

export default function BagDrawer() {
  const { open, lines, toggle, setQty, remove, subtotalCents } = useCart();

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div
          onClick={() => toggle(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Drawer */}
      <aside
        aria-hidden={!open}
        aria-label="Your bag"
        className={`fixed right-0 top-0 z-50 flex h-full w-[min(92vw,400px)] flex-col bg-white dark:bg-neutral-900 shadow-2xl transition-transform duration-300 ease-in-out border-l border-neutral-200 dark:border-neutral-800 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
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

        {/* Cart Item Lines */}
        <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? (
            <li className="flex flex-col items-center justify-center h-48 text-center text-sm text-neutral-500">
              <svg
                className="size-12 mb-3 text-neutral-300 dark:text-neutral-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
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
                      ${(l.priceCents / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 bg-neutral-50 dark:bg-neutral-800">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => setQty(l.key, l.qty - 1)}
                        className="flex size-6 items-center justify-center rounded text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {l.qty}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => setQty(l.key, l.qty + 1)}
                        className="flex size-6 items-center justify-center rounded text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => remove(l.key)}
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

        {/* Footer */}
        <footer className="space-y-4 border-t border-neutral-200 dark:border-neutral-800 px-6 py-5 bg-neutral-50/50 dark:bg-neutral-950/50">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
            <span className="font-bold text-neutral-900 dark:text-neutral-100">
              ${(subtotalCents() / 100).toFixed(2)}
            </span>
          </div>
          <button
            disabled
            className="w-full rounded-xl bg-neutral-900 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md disabled:opacity-40 disabled:cursor-not-allowed dark:bg-white dark:text-neutral-950"
          >
            Checkout (enabled in Phase 4)
          </button>
        </footer>
      </aside>
    </>
  );
}
