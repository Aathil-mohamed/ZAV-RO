import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const sharpPath = path.resolve(__dirname, '../apps/web/node_modules/sharp');
const sharp = require(sharpPath);

export const SEED_CATALOG = [
  // MEN (8 Products)
  {
    gender: 'men',
    slug: 'mens-hoodie',
    name: "Men's Heavyweight Hoodie",
    category: 'Hoodies & Sweatshirts',
    priceCents: 12000,
    customizable: true,
    colors: [
      { name: 'Onyx Black', slug: 'black', hex: '#18181b', textDark: false, inStock: true },
      { name: 'Heather Grey', slug: 'heather-grey', hex: '#71717a', textDark: false, inStock: true },
      { name: 'Midnight Navy', slug: 'navy', hex: '#1e3a8a', textDark: false, inStock: true },
      { name: 'Forest Green', slug: 'forest-green', hex: '#14532d', textDark: false, inStock: false },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-tshirt',
    name: "Men's Boxy Fit Tee",
    category: 'T-Shirts',
    priceCents: 5500,
    customizable: true,
    colors: [
      { name: 'Optic White', slug: 'white', hex: '#f8fafc', textDark: true, inStock: true },
      { name: 'Pure Black', slug: 'black', hex: '#18181b', textDark: false, inStock: true },
      { name: 'Army Olive', slug: 'olive', hex: '#3f6212', textDark: false, inStock: true },
      { name: 'Slate Grey', slug: 'slate', hex: '#475569', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-crewneck',
    name: "Men's French Terry Crewneck",
    category: 'Hoodies & Sweatshirts',
    priceCents: 9800,
    customizable: false,
    colors: [
      { name: 'Charcoal', slug: 'charcoal', hex: '#27272a', textDark: false, inStock: true },
      { name: 'Sand Oat', slug: 'sand', hex: '#d6c7b2', textDark: true, inStock: true },
      { name: 'Deep Teal', slug: 'teal', hex: '#0f766e', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-jacket',
    name: "Men's Minimalist Coach Jacket",
    category: 'Jackets & Outerwear',
    priceCents: 18500,
    customizable: false,
    colors: [
      { name: 'Matte Black', slug: 'black', hex: '#09090b', textDark: false, inStock: true },
      { name: 'Burnt Ochre', slug: 'ochre', hex: '#b45309', textDark: false, inStock: true },
      { name: 'Stone Grey', slug: 'stone', hex: '#a8a29e', textDark: true, inStock: true },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-longsleeve',
    name: "Men's Relaxed Longsleeve",
    category: 'T-Shirts',
    priceCents: 6800,
    customizable: false,
    colors: [
      { name: 'Bone White', slug: 'bone', hex: '#f1f5f9', textDark: true, inStock: true },
      { name: 'Washed Black', slug: 'washed-black', hex: '#334155', textDark: false, inStock: true },
      { name: 'Cognac', slug: 'cognac', hex: '#9a3412', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-oversized-tee',
    name: "Men's Streetwear Oversized Tee",
    category: 'T-Shirts',
    priceCents: 6200,
    customizable: false,
    colors: [
      { name: 'Off-White', slug: 'off-white', hex: '#e2e8f0', textDark: true, inStock: true },
      { name: 'Tar Black', slug: 'tar-black', hex: '#1e293b', textDark: false, inStock: true },
      { name: 'Moss Green', slug: 'moss', hex: '#365314', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-zip-hoodie',
    name: "Men's Full-Zip Thermal Hoodie",
    category: 'Hoodies & Sweatshirts',
    priceCents: 13500,
    customizable: false,
    colors: [
      { name: 'Heather Grey', slug: 'grey', hex: '#9ca3af', textDark: true, inStock: true },
      { name: 'Pitch Black', slug: 'black', hex: '#0f172a', textDark: false, inStock: true },
      { name: 'Espresso Brown', slug: 'espresso', hex: '#451a03', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'men',
    slug: 'mens-sweatpants',
    name: "Men's Tailored Sweatpants",
    category: 'Pants',
    priceCents: 8900,
    customizable: false,
    colors: [
      { name: 'Graphite', slug: 'graphite', hex: '#374151', textDark: false, inStock: true },
      { name: 'Camel Tan', slug: 'camel', hex: '#d97706', textDark: false, inStock: true },
      { name: 'Nightfall', slug: 'nightfall', hex: '#111827', textDark: false, inStock: true },
    ],
  },

  // WOMEN (8 Products)
  {
    gender: 'women',
    slug: 'womens-dress-aline',
    name: "Women's A-Line Midi Dress",
    category: 'Dresses',
    priceCents: 14500,
    customizable: true,
    colors: [
      { name: 'Crimson Red', slug: 'crimson', hex: '#991b1b', textDark: false, inStock: true },
      { name: 'Emerald', slug: 'emerald', hex: '#065f46', textDark: false, inStock: true },
      { name: 'Noir', slug: 'black', hex: '#18181b', textDark: false, inStock: true },
      { name: 'Blush Pink', slug: 'blush', hex: '#fb7185', textDark: true, inStock: false },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-hoodie',
    name: "Women's Cropped Fleece Hoodie",
    category: 'Hoodies & Sweatshirts',
    priceCents: 11000,
    customizable: true,
    colors: [
      { name: 'Alabaster Cream', slug: 'cream', hex: '#fef3c7', textDark: true, inStock: true },
      { name: 'Lilac', slug: 'lavender', hex: '#c084fc', textDark: true, inStock: true },
      { name: 'Deep Black', slug: 'black', hex: '#18181b', textDark: false, inStock: true },
      { name: 'Sage Green', slug: 'sage', hex: '#a3e635', textDark: true, inStock: true },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-tshirt',
    name: "Women's Ribbed Baby Tee",
    category: 'T-Shirts',
    priceCents: 4800,
    customizable: false,
    colors: [
      { name: 'Clean White', slug: 'white', hex: '#ffffff', textDark: true, inStock: true },
      { name: 'Butter Yellow', slug: 'butter', hex: '#fef08a', textDark: true, inStock: true },
      { name: 'Ink Black', slug: 'black', hex: '#111827', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-crewneck',
    name: "Women's Relaxed Fit Crewneck",
    category: 'Hoodies & Sweatshirts',
    priceCents: 9200,
    customizable: false,
    colors: [
      { name: 'Muted Rose', slug: 'rose', hex: '#fda4af', textDark: true, inStock: true },
      { name: 'Sky Slate', slug: 'slate', hex: '#64748b', textDark: false, inStock: true },
      { name: 'Vanilla Ice', slug: 'vanilla', hex: '#fafaf9', textDark: true, inStock: true },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-slip-dress',
    name: "Women's Silk Satin Slip Dress",
    category: 'Dresses',
    priceCents: 16800,
    customizable: false,
    colors: [
      { name: 'Champagne Gold', slug: 'champagne', hex: '#fde047', textDark: true, inStock: true },
      { name: 'Midnight Plum', slug: 'plum', hex: '#581c87', textDark: false, inStock: true },
      { name: 'Jet Black', slug: 'black', hex: '#030712', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-cardigan',
    name: "Women's Ribbed Knit Cardigan",
    category: 'Knitwear',
    priceCents: 13500,
    customizable: false,
    colors: [
      { name: 'Oatmeal Melange', slug: 'oatmeal', hex: '#e7e5e4', textDark: true, inStock: true },
      { name: 'Olive Grove', slug: 'olive', hex: '#4d7c0f', textDark: false, inStock: true },
      { name: 'Espresso', slug: 'espresso', hex: '#3b0764', textDark: false, inStock: true },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-blazer',
    name: "Women's Tailored Oversized Blazer",
    category: 'Jackets & Outerwear',
    priceCents: 21000,
    customizable: false,
    colors: [
      { name: 'Taupe Houndstooth', slug: 'taupe', hex: '#78716c', textDark: false, inStock: true },
      { name: 'Midnight Charcoal', slug: 'charcoal', hex: '#1f2937', textDark: false, inStock: true },
      { name: 'Ivory Cream', slug: 'ivory', hex: '#fffbeb', textDark: true, inStock: true },
    ],
  },
  {
    gender: 'women',
    slug: 'womens-joggers',
    name: "Women's High-Rise Fleece Joggers",
    category: 'Pants',
    priceCents: 8500,
    customizable: false,
    colors: [
      { name: 'Cloud Grey', slug: 'grey', hex: '#d1d5db', textDark: true, inStock: true },
      { name: 'Dark Moss', slug: 'moss', hex: '#14532d', textDark: false, inStock: true },
      { name: 'Classic Black', slug: 'black', hex: '#09090b', textDark: false, inStock: true },
    ],
  },
];

function generateSvg({ name, colorName, hex, textDark, width, height }) {
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

    <!-- Studio Info Overlay Badge -->
    <g transform="translate(600, 1140)">
      <rect x="-260" y="-120" width="520" height="240" rx="24" fill="#000000" fill-opacity="0.65" stroke="#3f3f46" stroke-width="1.5" />
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

function generateRoomSvg(width, height) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wallGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1c1917" />
        <stop offset="70%" stop-color="#292524" />
        <stop offset="100%" stop-color="#1c1917" />
      </linearGradient>
      <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0c0a09" />
        <stop offset="100%" stop-color="#1c1917" />
      </linearGradient>
      <radialGradient id="ambientLight" cx="50%" cy="30%" r="65%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="windowLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.06" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Back Wall -->
    <rect x="0" y="0" width="1920" height="780" fill="url(#wallGradient)" />
    <!-- Ambient Wall Glow -->
    <rect x="0" y="0" width="1920" height="780" fill="url(#ambientLight)" />

    <!-- Architectural Window Light Cast -->
    <polygon points="120,0 680,0 950,780 0,780" fill="url(#windowLight)" />

    <!-- Floor Line & Concrete Floor -->
    <line x1="0" y1="780" x2="1920" y2="780" stroke="#44403c" stroke-width="2" />
    <rect x="0" y="780" width="1920" height="300" fill="url(#floorGradient)" />

    <!-- Subtle Architectural Columns / Paneling in background -->
    <line x1="380" y1="0" x2="380" y2="780" stroke="#0c0a09" stroke-width="1.5" opacity="0.4" />
    <line x1="1540" y1="0" x2="1540" y2="780" stroke="#0c0a09" stroke-width="1.5" opacity="0.4" />

    <!-- Warm Floor Reflection -->
    <ellipse cx="960" cy="850" rx="480" ry="40" fill="#ffffff" opacity="0.02" />
  </svg>
  `;
}

async function main() {
  const publicDir = path.resolve(__dirname, '../apps/web/public');
  const baseOutputDir = path.join(publicDir, 'dev-models');

  // 1. Generate room.webp if not present
  const roomPath = path.join(publicDir, 'room.webp');
  console.log('Generating room background (1920x1080 WebP)...');
  const roomSvg = generateRoomSvg(1920, 1080);
  await sharp(Buffer.from(roomSvg))
    .resize(1920, 1080)
    .webp({ quality: 90 })
    .toFile(roomPath);
  console.log(`Generated: ${roomPath}`);

  // 2. Generate all garments x colors
  let count = 0;

  for (const garment of SEED_CATALOG) {
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

      // High-res 1200x2400 WebP
      await sharp(svgBuffer)
        .resize(1200, 2400)
        .webp({ quality: 90 })
        .toFile(fullImagePath);

      // 400px wide thumbnail WebP (400x800)
      await sharp(svgBuffer)
        .resize(400, 800)
        .webp({ quality: 80 })
        .toFile(thumbImagePath);

      console.log(`Generated: ${garment.gender}/${garment.slug}/${color.slug}.webp (+thumb)`);
      count += 2;
    }
  }

  console.log(`\nSuccessfully generated ${count} garment images across ${SEED_CATALOG.length} garments in ${baseOutputDir}`);
}

main().catch((err) => {
  console.error('Error generating placeholders:', err);
  process.exit(1);
});
