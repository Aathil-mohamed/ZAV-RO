// apps/web/lib/renderPanel.test.ts
import { describe, it, expect, vi, beforeAll } from "vitest";

// Provide minimal DOM mocks before the module is imported
// (Vitest runs in jsdom environment if configured, but we keep this self-contained)

class MockImage {
  crossOrigin = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  _src = "";
  width = 100;
  height = 100;
  get src() { return this._src; }
  set src(v: string) {
    this._src = v;
    // Simulate async load failure (no actual network in test)
    setTimeout(() => { this.onerror?.(); }, 0);
  }
}

// @ts-expect-error -- simplified mock
globalThis.Image = MockImage;

// @ts-expect-error -- simplified mock
globalThis.DOMMatrix = class {
  translate() { return this; }
  rotate() { return this; }
  scale() { return this; }
};

type RenderPanelModule = typeof import("./renderPanel");
let renderPanel: RenderPanelModule["renderPanel"];

function makeCanvas() {
  const ctx = {
    fillStyle: "",
    globalCompositeOperation: "source-over",
    globalAlpha: 1,
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    createPattern: vi.fn(() => ({ setTransform: vi.fn() })),
    textAlign: "",
    textBaseline: "",
    font: "",
  };
  return { width: 2, height: 2, getContext: vi.fn(() => ctx) } as unknown as HTMLCanvasElement;
}

beforeAll(async () => {
  const mod = await import("./renderPanel");
  renderPanel = mod.renderPanel;
});

describe("renderPanel", () => {
  it("returns false when a newer render supersedes this one", async () => {
    const canvas = makeCanvas();
    const panel = { id: "front", label: "Front", size: [512, 512] as [number, number], outline: "", allowPrint: true };
    const design = { fill: "#ffffff", fabric: "cotton", layers: [] };

    // Start render 1 then immediately render 2 — token increments, so render 1 loses
    const p1 = renderPanel(canvas, panel, design);
    const p2 = renderPanel(canvas, panel, design);

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toBe(false);
    expect(r2).toBe(true);
  });

  it("returns true for a sole render that completes", async () => {
    const canvas = makeCanvas();
    const panel = { id: "back", label: "Back", size: [256, 256] as [number, number], outline: "", allowPrint: false };
    const design = { fill: "#ff0000", fabric: "cotton", layers: [] };

    const result = await renderPanel(canvas, panel, design);
    expect(result).toBe(true);
  });
});
