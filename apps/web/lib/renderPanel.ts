// apps/web/lib/renderPanel.ts
import type { Panel } from "@/lib/garments";
import type { PanelDesign } from "@/store/designer";

const cache = new Map<string, Promise<HTMLImageElement>>();
export const loadImg = (src: string) => {
  if (!cache.has(src)) {
    cache.set(src, new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.crossOrigin = "anonymous"; // REQUIRED so the canvas is not tainted for WebGL
      i.onload = () => res(i); i.onerror = () => { cache.delete(src); rej(new Error("img " + src)); }; i.src = src;
    }));
  }
  return cache.get(src)!;
};

const tokens = new WeakMap<HTMLCanvasElement, number>();

export type RenderOpts = { scale?: number; skip?: Array<"pattern" | "image" | "text"> };

/** Returns false if a newer render of the same canvas started meanwhile (so callers skip needsUpdate). */
export async function renderPanel(canvas: HTMLCanvasElement, panel: Panel, design: PanelDesign, opts: RenderOpts = {}): Promise<boolean> {
  const token = (tokens.get(canvas) ?? 0) + 1; tokens.set(canvas, token);
  const scale = opts.scale ?? 1, skip = opts.skip ?? [];
  const w = Math.max(2, Math.round(panel.size[0] * scale)), h = Math.max(2, Math.round(panel.size[1] * scale));

  // 1) load every asset first, so drawing below is synchronous and never flickers
  const [fabric, imgs] = await Promise.all([
    loadImg(`/fabrics/${design.fabric}.jpg`).catch(() => null),
    Promise.all(design.layers.map((l) =>
      l.type === "pattern" ? loadImg(`/pattern-tiles/${l.patternId}.png`).catch(() => null)
      : l.type === "image" ? loadImg(l.src).catch(() => null) : Promise.resolve(null))),
  ]);
  if (tokens.get(canvas) !== token) return false;

  canvas.width = w; canvas.height = h; // resizing also clears the canvas
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = design.fill; ctx.fillRect(0, 0, w, h);

  design.layers.forEach((l, i) => {
    if (skip.includes(l.type as "pattern" | "image" | "text")) return;
    const img = imgs[i];
    ctx.save();
    if (l.type === "pattern" && img) {
      const s = (l.tile * w) / img.width;
      const pat = ctx.createPattern(img, "repeat")!;
      pat.setTransform(new DOMMatrix().translate(l.x * w, l.y * h).rotate(l.rotation).scale(s));
      ctx.fillStyle = pat; ctx.fillRect(0, 0, w, h);
    } else if (l.type === "image" && img) {
      const iw = l.w * w, ih = iw * (img.height / img.width);
      ctx.translate(l.x * w, l.y * h); ctx.rotate((l.rotation * Math.PI) / 180); ctx.globalAlpha = l.opacity;
      ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
    } else if (l.type === "text") {
      ctx.translate(l.x * w, l.y * h); ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.fillStyle = l.color; ctx.font = `${l.size * h}px ${l.font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(l.text, 0, 0);
    }
    ctx.restore();
  });

  // 2) weave texture last, multiplied, so fabric shows through colors, prints and artwork
  if (fabric) {
    ctx.globalCompositeOperation = "multiply"; ctx.drawImage(fabric, 0, 0, w, h); ctx.globalCompositeOperation = "source-over";
  }
  return true;
}
