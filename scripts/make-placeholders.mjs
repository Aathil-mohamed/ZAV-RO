import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Load sharp from apps/web
const sharpPath = path.resolve(__dirname, '../apps/web/node_modules/sharp');
const sharp = require(sharpPath);

const GARMENTS = [
  {
    gender: 'men',
    slug: 'mens-hoodie',
    name: "Men's Oversized Hoodie",
    colors: [
      { name: 'Onyx Black', slug: 'black', hex: '#18181b', textDark: false },
      { name: 'Heather Grey', slug: 'heather-grey', hex: '#71717a', textDark: false },
      { name: 'Midnight Navy', slug: 'navy', hex: '#1e3a8a', textDark: false },
      { name: 'Forest Green', slug: 'forest-green', hex: '#14532d', textDark: false },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-tshirt',
    name: "Men's Boxy Fit Tee",
    colors: [
      { name: 'Optic White', slug: 'white', hex: '#f8fafc', textDark: true },
      { name: 'Pure Black', slug: 'black', hex: '#18181b', textDark: false },
      { name: 'Army Olive', slug: 'olive', hex: '#3f6212', textDark: false },
      { name: 'Slate Grey', slug: 'slate', hex: '#475569', textDark: false },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-dress-aline',
    name: "Women's A-Line Midi Dress",
    colors: [
      { name: 'Crimson Red', slug: 'crimson', hex: '#991b1b', textDark: false },
      { name: 'Emerald', slug: 'emerald', hex: '#065f46', textDark: false },
      { name: 'Noir', slug: 'black', hex: '#18181b', textDark: false },
      { name: 'Blush Pink', slug: 'blush', hex: '#fb7185', textDark: true },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-hoodie',
    name: "Women's Cropped Hoodie",
    colors: [
      { name: 'Alabaster Cream', slug: 'cream', hex: '#fef3c7', textDark: true },
      { name: 'Lilac', slug: 'lavender', hex: '#c084fc', textDark: true },
      { name: 'Deep Black', slug: 'black', hex: '#18181b', textDark: false },
      { name: 'Sage Green', slug: 'sage', hex: '#a3e635', textDark: true },
    ],
  },
];

function generateSvg({ name, colorName, hex, textDark, width, height }) {
  const textColor = textDark ? '#0f172a' : '#f8fafc';
  const subtitleColor = textDark ? '#475569' : '#94a3b8';

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 1200 2400" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="studioBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#262626" />
        <stop offset="65%" stop-color="#171717" />
        <stop offset="100%" stop-color="#0a0a0a" />
      </linearGradient>
      <radialGradient id="spotlight" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <ellipse id="podiumShadow" cx="600" cy="2150" rx="360" ry="60" fill="#000000" opacity="0.6" />
    </defs>

    <!-- Studio Background -->
    <rect width="1200" height="2400" fill="url(#studioBg)" />
    <rect width="1200" height="2400" fill="url(#spotlight)" />

    <!-- Floor Shadow -->
    <use href="#podiumShadow" />

    <!-- Mannequin / Model Base Silhouette -->
    <!-- Head -->
    <ellipse cx="600" cy="460" rx="90" ry="120" fill="#3f3f46" />
    <!-- Neck -->
    <rect x="560" y="560" width="80" height="80" rx="10" fill="#3f3f46" />

    <!-- Garment Torso / Main Body Silhouette -->
    <path d="M 420 640 
             C 480 610, 720 610, 780 640 
             L 940 920 
             L 860 980 
             L 760 840 
             L 770 1620 
             C 770 1680, 430 1680, 430 1620 
             L 440 840 
             L 340 980 
             L 260 920 Z" 
          fill="${hex}" 
          stroke="#09090b" 
          stroke-width="4" />

    <!-- Subtle inner garment folds / highlights -->
    <path d="M 440 840 L 430 1620" stroke="#000000" stroke-width="4" opacity="0.25" />
    <path d="M 760 840 L 770 1620" stroke="#000000" stroke-width="4" opacity="0.25" />
    <path d="M 600 640 L 600 1620" stroke="#ffffff" stroke-width="2" opacity="0.1" />

    <!-- Legs Silhouette -->
    <rect x="470" y="1620" width="100" height="480" rx="20" fill="#27272a" />
    <rect x="630" y="1620" width="100" height="480" rx="20" fill="#27272a" />

    <!-- Studio Info Overlay -->
    <g transform="translate(600, 1140)">
      <rect x="-260" y="-120" width="520" height="240" rx="24" fill="#000000" fill-opacity="0.55" />
      <text x="0" y="-50" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" letter-spacing="8" fill="#d4d4d8">ZAVÉRO STUDIO</text>
      <text x="0" y="10" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="600" fill="#ffffff">${name}</text>
      <circle cx="-60" cy="65" r="14" fill="${hex}" stroke="#ffffff" stroke-width="3" />
      <text x="-35" y="73" text-anchor="start" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500" fill="${subtitleColor}">${colorName}</text>
    </g>

    <!-- Bottom watermark -->
    <text x="600" y="2320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="20" letter-spacing="4" fill="#52525b">DEV PREVIEW MODEL • 1200 x 2400</text>
  </svg>
  `;
}

async function main() {
  const publicDir = path.resolve(__dirname, '../apps/web/public');
  const baseOutputDir = path.join(publicDir, 'dev-models');

  let count = 0;

  for (const garment of GARMENTS) {
    const garmentDir = path.join(baseOutputDir, garment.gender, garment.slug);
    fs.mkdirSync(garmentDir, { recursive: true });

    for (const color of garment.colors) {
      const svgString = generateSvg({
        name: garment.name,
        colorName: color.name,
        hex: color.hex,
        textDark: color.textDark,
        width: 1200,
        height: 2400,
      });

      const fullImagePath = path.join(garmentDir, `${color.slug}.webp`);
      const thumbImagePath = path.join(garmentDir, `${color.slug}-thumb.webp`);

      const svgBuffer = Buffer.from(svgString);

      // 1. High-res 1200x2400 WebP
      await sharp(svgBuffer)
        .resize(1200, 2400)
        .webp({ quality: 90 })
        .toFile(fullImagePath);

      // 2. 400px wide thumbnail WebP (400x800)
      await sharp(svgBuffer)
        .resize(400, 800)
        .webp({ quality: 80 })
        .toFile(thumbImagePath);

      console.log(`Generated: ${garment.gender}/${garment.slug}/${color.slug}.webp (+thumb)`);
      count += 2;
    }
  }

  console.log(`\nSuccessfully generated ${count} placeholder model assets in ${baseOutputDir}`);
}

main().catch((err) => {
  console.error('Error generating placeholders:', err);
  process.exit(1);
});
