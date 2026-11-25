import { describe, it, expect, beforeAll } from "vitest";
import { buildPayHereForm } from "./payhere";

// Minimal DOM mock for Node Vitest environment
beforeAll(() => {
  if (typeof document === "undefined") {
    (globalThis as unknown as { document: unknown }).document = {
      createElement: (tag: string) => {
        const el: Record<string, unknown> = {
          tagName: tag.toUpperCase(),
          style: {},
          children: [] as unknown[],
          appendChild(child: unknown) {
            (this.children as unknown[]).push(child);
            return child;
          },
        };
        return el;
      },
    };
  }
});

describe("buildPayHereForm", () => {
  it("builds a hidden POST form containing every field returned by the API", () => {
    const fields = {
      merchant_id: "123456",
      order_id: "ORD-000001-ABC-1",
      amount: "2500.00",
      currency: "LKR",
      hash: "ABCDEF",
    };

    const form = buildPayHereForm("https://sandbox.payhere.lk/pay/checkout", fields) as unknown as {
      method: string;
      action: string;
      children: Array<{ type: string; name: string; value: string }>;
    };

    expect(form.method).toBe("POST");
    expect(form.action).toBe("https://sandbox.payhere.lk/pay/checkout");
    expect(form.children).toHaveLength(Object.keys(fields).length);
    for (const [k, v] of Object.entries(fields)) {
      expect(form.children.find((c) => c.name === k && c.value === v && c.type === "hidden")).toBeTruthy();
    }
  });
});
