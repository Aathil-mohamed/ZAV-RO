// apps/web/store/designer.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useDesigner, blank } from "./designer";
import { GARMENTS, estimatePriceCents, FABRICS } from "../lib/garments";

const tshirt = GARMENTS.find((g) => g.slug === "mens-tshirt")!;
const hoodie = GARMENTS.find((g) => g.slug === "mens-hoodie")!;

// Reset the store before each test
beforeEach(() => {
  useDesigner.getState().setGarment("mens-tshirt");
});

describe("estimatePriceCents", () => {
  it("returns base price with no changes", () => {
    const panels = Object.fromEntries(tshirt.panels.map((p) => [p.id, blank()]));
    expect(estimatePriceCents(tshirt, panels, {})).toBe(tshirt.basePriceCents);
  });

  it("adds variant delta for full sleeve", () => {
    const panels = Object.fromEntries(tshirt.panels.map((p) => [p.id, blank()]));
    const result = estimatePriceCents(tshirt, panels, { sleeve: "full" });
    expect(result).toBe(tshirt.basePriceCents + 90000);
  });

  it("adds fabric delta for linen", () => {
    const panels = Object.fromEntries(tshirt.panels.map((p) => [p.id, { ...blank(), fabric: "linen" }]));
    // All panels share one unique fabric so only one fabric delta
    const result = estimatePriceCents(tshirt, panels, {});
    expect(result).toBe(tshirt.basePriceCents + FABRICS.linen.priceDeltaCents);
  });

  it("caps print price at 300000 cents (5+ printed panels)", () => {
    const panels = Object.fromEntries(tshirt.panels.map((p) => [
      p.id,
      { ...blank(), layers: [{ id: "x", type: "text" as const, text: "hi", font: "sans", size: 0.1, color: "#000", x: 0.5, y: 0.5, rotation: 0 }] },
    ]));
    // 5 panels × 60000 = 300000 → cap
    const result = estimatePriceCents(tshirt, panels, {});
    expect(result).toBe(tshirt.basePriceCents + 300000);
  });
});

describe("useDesigner store", () => {
  it("blanks all panels on setGarment", () => {
    const { panels, garment } = useDesigner.getState();
    garment.panels.forEach((p) => {
      expect(panels[p.id]).toEqual(blank());
    });
  });

  it("mirrored piece always equals its source after updatePanel", () => {
    const { updatePanel } = useDesigner.getState();
    const leftId = "sleeve_L";
    const rightId = "sleeve_R";
    // Update the source (left)
    updatePanel(leftId, { fill: "#ff0000" });
    const { panels } = useDesigner.getState();
    // Right should mirror left
    if (tshirt.panels.find((p) => p.id === rightId)) {
      expect(panels[rightId]?.fill).toBe(panels[leftId]?.fill);
    }
  });

  it("undo/redo round-trip", () => {
    const store = useDesigner.getState();
    // Force a push by advancing time (simulate a 600 ms gap)
    const originalLastPush = store.lastPush;
    Object.assign(store, { lastPush: originalLastPush - 1000 }); // simulate 1 s ago

    store.updatePanel("front", { fill: "#aaaaaa" });
    const after = useDesigner.getState();
    expect(after.panels["front"]?.fill).toBe("#aaaaaa");

    after.undo();
    const undone = useDesigner.getState();
    // After undo, fill should be back to white
    expect(undone.panels["front"]?.fill).toBe("#ffffff");

    undone.redo();
    const redone = useDesigner.getState();
    expect(redone.panels["front"]?.fill).toBe("#aaaaaa");
  });

  it("rapid updates within 500 ms coalesce into one undo step", () => {
    const { history: before } = useDesigner.getState();
    const len = before.length;

    // Three rapid updates — all within the same 500 ms window
    useDesigner.getState().updatePanel("front", { fill: "#111111" });
    useDesigner.getState().updatePanel("front", { fill: "#222222" });
    useDesigner.getState().updatePanel("front", { fill: "#333333" });

    const { history: after } = useDesigner.getState();
    // At most one new history entry (possibly zero if lastPush was very recent)
    expect(after.length - len).toBeLessThanOrEqual(1);
  });

  it("applyToAll sets fill on every panel", () => {
    useDesigner.getState().applyToAll({ fill: "#123456" });
    const { garment, panels } = useDesigner.getState();
    garment.panels.forEach((p) => {
      expect(panels[p.id]?.fill).toBe("#123456");
    });
  });

  it("resetPanel restores a single piece to blank", () => {
    useDesigner.getState().updatePanel("front", { fill: "#ff0000" });
    useDesigner.getState().resetPanel("front");
    expect(useDesigner.getState().panels["front"]).toEqual(blank());
  });

  it("selectPanel redirects mirrored piece to its source", () => {
    useDesigner.getState().selectPanel("sleeve_R");
    expect(useDesigner.getState().selectedPanel).toBe("sleeve_L");
  });
});
