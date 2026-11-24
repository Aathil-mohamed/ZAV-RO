import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartLine = {
  key: string;
  name: string;
  image: string;
  priceCents: number;
  qty: number;
  size?: string;
  variantId?: number;
  customDesignId?: number;
};

export type CartState = {
  open: boolean;
  lines: CartLine[];
  add: (l: Omit<CartLine, "qty" | "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  toggle: (open?: boolean) => void;
  subtotalCents: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      open: false,
      lines: [],
      add: (l) =>
        set((s) => {
          const key = `${l.variantId ?? "d" + l.customDesignId}-${l.size ?? ""}`;
          const found = s.lines.find((x) => x.key === key);
          return {
            open: true,
            lines: found
              ? s.lines.map((x) =>
                  x.key === key ? { ...x, qty: Math.min(10, x.qty + 1) } : x
                )
              : [...s.lines, { ...l, key, qty: 1 }],
          };
        }),
      setQty: (key, qty) =>
        set((s) => ({
          lines: s.lines.map((x) =>
            x.key === key ? { ...x, qty: Math.min(10, Math.max(1, qty)) } : x
          ),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((x) => x.key !== key) })),
      toggle: (open) => set((s) => ({ open: open ?? !s.open })),
      subtotalCents: () => get().lines.reduce((t, l) => t + l.priceCents * l.qty, 0),
      count: () => get().lines.reduce((t, l) => t + l.qty, 0),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (s) => ({ lines: s.lines }),
    }
  )
);
