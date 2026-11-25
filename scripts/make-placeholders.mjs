// scripts/make-placeholders.mjs
// Creates placeholder fabric JPGs and pattern-tile PNGs for local development.
// These are solid-grey/patterned images; replace with real CC0 textures before production.
// Run: node scripts/make-placeholders.mjs
import { createRequire } from "module";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const { createCanvas } = require("canvas");

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

// ---- Fabrics: 1024x1024 grayscale JPEG ----
const FABRICS = ["cotton","polyester","linen","denim","fleece","rib_knit","chiffon","velvet","satin","silk"];
const ROUGHNESS_GREY = { cotton:200, polyester:220, linen:190, denim:180, fleece:170, rib_knit:195, chiffon:230, velvet:160, satin:235, silk:240 };
ensureDir("apps/web/public/fabrics");

for (const fab of FABRICS) {
  const path = `apps/web/public/fabrics/${fab}.jpg`;
  if (existsSync(path)) continue;
  const c = createCanvas(1024, 1024); const ctx = c.getContext("2d");
  const g = ROUGHNESS_GREY[fab];
  // Simple weave-like noise pattern
  ctx.fillStyle = `rgb(${g},${g},${g})`; ctx.fillRect(0, 0, 1024, 1024);
  for (let y = 0; y < 1024; y += 4) {
    for (let x = 0; x < 1024; x += 4) {
      const v = g + (((x ^ y) & 7) - 3);
      ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x, y, 2, 2);
    }
  }
  writeFileSync(path, c.toBuffer("image/jpeg", { quality: 0.85 }));
  console.log(`fabric: ${path}`);
}

// ---- Pattern tiles: 512x512 transparent PNG ----
const PATTERNS = {
  stripes: (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    for (let x = 0; x < 512; x += 32) {
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(x, 0, 16, 512);
    }
  },
  checks: (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 32) for (let x = 0; x < 512; x += 32) {
      if ((x + y) % 64 === 0) { ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(x, y, 32, 32); }
    }
  },
  polka: (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    for (let y = 20; y < 512; y += 48) for (let x = 20; x < 512; x += 48) {
      ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fill();
    }
  },
  floral: (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) {
      for (let p = 0; p < 5; p++) {
        const angle = (p / 5) * Math.PI * 2;
        const ex = x + 32 + Math.cos(angle) * 12, ey = y + 32 + Math.sin(angle) * 12;
        ctx.beginPath(); ctx.ellipse(ex, ey, 8, 4, angle, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,100,150,0.4)"; ctx.fill();
      }
    }
  },
  calligraphy: (ctx) => {
    ctx.clearRect(0, 0, 512, 512); ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 3;
    for (let y = 0; y < 512; y += 60) {
      ctx.beginPath(); ctx.moveTo(20, y + 30);
      ctx.bezierCurveTo(150, y, 350, y + 60, 490, y + 20); ctx.stroke();
    }
  },
  houndstooth: (ctx) => {
    ctx.clearRect(0, 0, 512, 512); const s = 32;
    for (let y = 0; y < 512; y += s) for (let x = 0; x < 512; x += s) {
      const col = (Math.floor(x/s) + Math.floor(y/s)) % 2 === 0 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
      ctx.fillStyle = col; ctx.fillRect(x, y, s, s);
    }
  },
  camo: (ctx) => {
    ctx.clearRect(0, 0, 512, 512);
    const cols = ["rgba(60,80,30,0.6)","rgba(80,70,30,0.5)","rgba(40,60,20,0.7)","rgba(100,100,50,0.4)"];
    for (let i = 0; i < 80; i++) {
      const x = Math.random()*512, y = Math.random()*512, r = 20+Math.random()*50;
      ctx.beginPath(); ctx.ellipse(x, y, r, r*0.6, Math.random()*Math.PI, 0, Math.PI*2);
      ctx.fillStyle = cols[i%cols.length]; ctx.fill();
    }
  },
};

ensureDir("apps/web/public/pattern-tiles");
for (const [id, draw] of Object.entries(PATTERNS)) {
  const path = `apps/web/public/pattern-tiles/${id}.png`;
  if (existsSync(path)) continue;
  const c = createCanvas(512, 512); draw(c.getContext("2d"));
  writeFileSync(path, c.toBuffer("image/png"));
  console.log(`pattern: ${path}`);
}

// ---- Pattern outline SVGs from registry.json ----
if (existsSync("apps/api/resources/registry.json")) {
  const reg = JSON.parse(readFileSync("apps/api/resources/registry.json", "utf8"));
  let svgCount = 0;
  for (const g of reg.garments) {
    for (const p of g.panels) {
      if (p.mirrorOf) continue;
      const svgPath = `apps/web/public${p.outline}`;
      if (existsSync(svgPath)) continue;
      ensureDir(dirname(svgPath));
      const [w, h] = p.size;
      const pad = Math.round(Math.min(w, h) * 0.05);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect x="${pad}" y="${pad}" width="${w - pad * 2}" height="${h - pad * 2}" rx="24" fill="none" stroke="#111111" stroke-width="4" stroke-dasharray="16 10" />
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${Math.round(Math.min(w, h) * 0.06)}" fill="#333333">${p.label}</text>
</svg>\n`;
      writeFileSync(svgPath, svg);
      svgCount++;
    }
  }
  console.log(`pattern SVGs generated: ${svgCount}`);
}

console.log("Placeholder assets ready.");
