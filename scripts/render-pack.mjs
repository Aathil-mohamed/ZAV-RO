// scripts/render-pack.mjs
// Renders high-resolution (scale 2) PNGs for every piece of a custom design for production export.
// Usage: node scripts/render-pack.mjs <design.json> <outputDir>

import { createRequire } from "module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { createCanvas, loadImage, DOMMatrix } = require("canvas");

const [, , designPath, outDir] = process.argv;
if (!designPath || !outDir) {
  console.error("Usage: node scripts/render-pack.mjs <design.json> <outputDir>");
  process.exit(1);
}

const payload = JSON.parse(readFileSync(designPath, "utf8"));
const reg = JSON.parse(readFileSync("apps/api/resources/registry.json", "utf8"));
const garment = reg.garments.find((g) => g.slug === payload.garment_slug);
if (!garment) {
  console.error(`Unknown garment: ${payload.garment_slug}`);
  process.exit(1);
}

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const SCALE = 2;

async function safeLoad(pathOrUrl) {
  try {
    return await loadImage(pathOrUrl);
  } catch {
    return null;
  }
}

for (const panel of garment.panels) {
  const design = payload.design?.panels?.[panel.id];
  if (!design) continue;

  const w = Math.max(2, Math.round(panel.size[0] * SCALE));
  const h = Math.max(2, Math.round(panel.size[1] * SCALE));
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = design.fill || "#ffffff";
  ctx.fillRect(0, 0, w, h);

  for (const l of design.layers || []) {
    ctx.save();
    if (l.type === "pattern") {
      const img = await safeLoad(`apps/web/public/pattern-tiles/${l.patternId}.png`);
      if (img) {
        const s = (l.tile * w) / img.width;
        const pat = ctx.createPattern(img, "repeat");
        if (pat && typeof pat.setTransform === "function" && DOMMatrix) {
          pat.setTransform(new DOMMatrix().translate(l.x * w, l.y * h).rotate(l.rotation).scale(s));
        }
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, w, h);
      }
    } else if (l.type === "image") {
      const img = await safeLoad(l.src);
      if (img) {
        const iw = l.w * w;
        const ih = iw * (img.height / img.width);
        ctx.translate(l.x * w, l.y * h);
        ctx.rotate((l.rotation * Math.PI) / 180);
        ctx.globalAlpha = l.opacity ?? 1;
        ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
      }
    } else if (l.type === "text") {
      ctx.translate(l.x * w, l.y * h);
      ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.fillStyle = l.color || "#000000";
      ctx.font = `${l.size * h}px ${l.font || "sans-serif"}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(l.text || "", 0, 0);
    }
    ctx.restore();
  }

  const fabric = await safeLoad(`apps/web/public/fabrics/${design.fabric}.jpg`);
  if (fabric) {
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(fabric, 0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  writeFileSync(join(outDir, `${panel.id}.png`), canvas.toBuffer("image/png"));
}

console.log(`Rendered production pack for ${garment.slug} -> ${outDir}`);
