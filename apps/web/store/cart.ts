import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";

export type CartLine = {
  id?: number;
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
  setQty: (key: string, qty: number, isLoggedIn?: boolean) => void;
  remove: (key: string, isLoggedIn?: boolean) => void;
  clear: () => void;
  toggle: (open?: boolean) => void;
  subtotalCents: () => number;
  count: () => number;
  mergeWithServer: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
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
      setQty: (key, qty, isLoggedIn = false) => {
        const clamped = Math.min(10, Math.max(1, qty));
        const target = get().lines.find((x) => x.key === key);
        set((s) => ({
          lines: s.lines.map((x) => (x.key === key ? { ...x, qty: clamped } : x)),
        }));
        if (isLoggedIn && target?.id) {
          api<{ lines: CartLine[] }>(`/api/cart/items/${target.id}`, {
            method: "PUT",
            body: JSON.stringify({ qty: clamped }),
          })
            .then((r) => set({ lines: r.lines }))
            .catch(() => {});
        }
      },
      remove: (key, isLoggedIn = false) => {
        const target = get().lines.find((x) => x.key === key);
        set((s) => ({ lines: s.lines.filter((x) => x.key !== key) }));
        if (isLoggedIn && target?.id) {
          api<{ lines: CartLine[] }>(`/api/cart/items/${target.id}`, {
            method: "DELETE",
          })
            .then((r) => set({ lines: r.lines }))
            .catch(() => {});
        }
      },
      clear: () => set({ lines: [] }),
      toggle: (open) => set((s) => ({ open: open ?? !s.open })),
      subtotalCents: () => get().lines.reduce((t, l) => t + l.priceCents * l.qty, 0),
      count: () => get().lines.reduce((t, l) => t + l.qty, 0),
      mergeWithServer: async () => {
        const guestLines = get().lines.map((l) => ({
          variantId: l.variantId,
          customDesignId: l.customDesignId,
          size: l.size,
          qty: l.qty,
        }));
        const res = await api<{ lines: CartLine[] }>("/api/cart/merge", {
          method: "POST",
          body: JSON.stringify({ lines: guestLines }),
        });
        set({ lines: res.lines });
      },
      refreshFromServer: async () => {
        const res = await api<{ lines: CartLine[] }>("/api/cart");
        set({ lines: res.lines });
      },
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
