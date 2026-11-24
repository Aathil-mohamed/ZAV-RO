import { describe, it, expect, beforeEach } from "vitest";

// Mock localStorage for node environment
const storage: Record<string, string> = {};
if (typeof window === "undefined" || !window.localStorage) {
  // @ts-ignore
  globalThis.localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      for (const k in storage) delete storage[k];
    },
    length: 0,
    key: () => null,
  };
}

import { useCart } from "./cart";

describe("useCart Store", () => {
  beforeEach(() => {
    useCart.setState({ open: false, lines: [] });
  });

  it("add() creates a line with qty 1", () => {
    useCart.getState().add({
      name: "Men's Hoodie",
      image: "/hoodie.webp",
      priceCents: 12000,
      size: "M",
      variantId: 101,
    });

    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(1);
    expect(lines[0].key).toBe("101-M");
    expect(useCart.getState().open).toBe(true);
  });

  it("add() merges identical lines and caps quantity at 10", () => {
    const item = {
      name: "Men's Hoodie",
      image: "/hoodie.webp",
      priceCents: 12000,
      size: "M",
      variantId: 101,
    };

    // Add 12 times
    for (let i = 0; i < 12; i++) {
      useCart.getState().add(item);
    }

    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].qty).toBe(10); // Capped at 10
  });

  it("add() distinguishes between different sizes of the same variant", () => {
    useCart.getState().add({
      name: "Men's Hoodie",
      image: "/hoodie.webp",
      priceCents: 12000,
      size: "M",
      variantId: 101,
    });
    useCart.getState().add({
      name: "Men's Hoodie",
      image: "/hoodie.webp",
      priceCents: 12000,
      size: "L",
      variantId: 101,
    });

    const lines = useCart.getState().lines;
    expect(lines).toHaveLength(2);
    expect(lines[0].key).toBe("101-M");
    expect(lines[1].key).toBe("101-L");
  });

  it("subtotalCents() calculates correct total sum", () => {
    useCart.getState().add({
      name: "Hoodie",
      image: "/hoodie.webp",
      priceCents: 10000, // $100.00
      size: "M",
      variantId: 1,
    });
    useCart.getState().add({
      name: "T-Shirt",
      image: "/tee.webp",
      priceCents: 4500, // $45.00
      size: "L",
      variantId: 2,
    });

    // 10000 + 4500 = 14500 cents
    expect(useCart.getState().subtotalCents()).toBe(14500);

    // Increase qty of T-Shirt to 3
    useCart.getState().setQty("2-L", 3);
    // 10000 + (4500 * 3) = 10000 + 13500 = 23500 cents
    expect(useCart.getState().subtotalCents()).toBe(23500);
  });

  it("remove() removes the line item and updates count", () => {
    useCart.getState().add({
      name: "Item 1",
      image: "/img1.webp",
      priceCents: 5000,
      size: "M",
      variantId: 1,
    });
    useCart.getState().add({
      name: "Item 2",
      image: "/img2.webp",
      priceCents: 3000,
      size: "S",
      variantId: 2,
    });

    expect(useCart.getState().count()).toBe(2);

    useCart.getState().remove("1-M");
    expect(useCart.getState().lines).toHaveLength(1);
    expect(useCart.getState().count()).toBe(1);
  });
});
