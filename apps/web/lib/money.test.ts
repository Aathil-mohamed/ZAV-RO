import { describe, it, expect } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney (LKR)", () => {
  it("formats minor units in LKR", () => {
    expect(formatMoney(0)).toMatch(/0(\.00)?$/);
    expect(formatMoney(45000)).toContain("450");
    expect(formatMoney(250000)).toContain("2,500");
    expect(formatMoney(1500000)).toContain("15,000");
  });
});
