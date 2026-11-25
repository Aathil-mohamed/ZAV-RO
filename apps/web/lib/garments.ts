// apps/web/lib/garments.ts
export type Panel = { id: string; label: string; size: [number, number]; outline: string; mirrorOf?: string; allowPrint: boolean };
export type VariantOption = { id: string; label: string; priceDeltaCents: number };
export type VariantGroup = { key: string; label: string; options: VariantOption[] };
export type GarmentDef = {
  slug: string; name: string; gender: "men" | "women"; model: string; basePriceCents: number;
  panels: Panel[]; variants: VariantGroup[];
};

const LKR_RATE = 300; // placeholder USD-like -> LKR conversion

/** Fabrics: files /fabrics/{id}.jpg are SEAMLESS GRAYSCALE weave maps (1024x1024) that tint with the chosen color. */
export const FABRICS: Record<string, { label: string; roughness: number; priceDeltaCents: number }> = {
  cotton:    { label: "Cotton",     roughness: 0.90, priceDeltaCents: 0 },
  polyester: { label: "Polyester",  roughness: 0.60, priceDeltaCents: 0 },
  linen:     { label: "Linen",      roughness: 0.95, priceDeltaCents: 600 * LKR_RATE },
  denim:     { label: "Denim",      roughness: 0.85, priceDeltaCents: 500 * LKR_RATE },
  fleece:    { label: "Fleece",     roughness: 1.00, priceDeltaCents: 400 * LKR_RATE },
  rib_knit:  { label: "Rib knit",   roughness: 0.95, priceDeltaCents: 300 * LKR_RATE },
  chiffon:   { label: "Chiffon",    roughness: 0.50, priceDeltaCents: 1000 * LKR_RATE },
  velvet:    { label: "Velvet",     roughness: 1.00, priceDeltaCents: 1200 * LKR_RATE },
  satin:     { label: "Satin",      roughness: 0.30, priceDeltaCents: 1400 * LKR_RATE },
  silk:      { label: "Silk",       roughness: 0.35, priceDeltaCents: 1800 * LKR_RATE },
};

/** Print patterns: files /pattern-tiles/{id}.png are seamless transparent PNG tiles (512x512) that keep their own colors. */
export const PATTERNS: { id: string; label: string }[] = [
  { id: "stripes", label: "Stripes" }, { id: "checks", label: "Checks" }, { id: "polka", label: "Polka dots" },
  { id: "floral", label: "Floral" }, { id: "calligraphy", label: "Calligraphy" },
  { id: "houndstooth", label: "Houndstooth" }, { id: "camo", label: "Camouflage" },
];

const opt = (id: string, label: string, priceDeltaCents = 0): VariantOption => ({ id, label, priceDeltaCents: priceDeltaCents * LKR_RATE });
const group = (key: string, label: string, options: VariantOption[]): VariantGroup => ({ key, label, options });

/** Structural variants. In the GLB each option is a node named  var__{key}__{optionId}  (see assets spec). First option = default. */
export const V = {
  sleeveMen:     group("sleeve", "Sleeve", [opt("half", "Half sleeve"), opt("full", "Full sleeve", 300)]),
  sleeveWomen:   group("sleeve", "Sleeve", [opt("sleeveless", "Sleeveless"), opt("short", "Short sleeve"), opt("threeq", "3/4 sleeve", 200), opt("full", "Full sleeve", 300)]),
  necklineMen:   group("neckline", "Neckline", [opt("round", "Round"), opt("v", "V-neck")]),
  necklineWomen: group("neckline", "Neckline", [opt("round", "Round"), opt("v", "V-neck"), opt("boat", "Boat"), opt("square", "Square")]),
  collar:        group("collar", "Collar", [opt("classic", "Classic"), opt("mandarin", "Mandarin"), opt("buttondown", "Button-down")]),
  pocket:        group("pocket", "Pocket", [opt("none", "None"), opt("chest", "Chest pocket", 100), opt("flap", "Flap pocket", 150), opt("double", "Double pocket", 200)]),
  buttons:       group("buttons", "Button design", [opt("standard", "Standard"), opt("contrast", "Contrast", 100), opt("metal", "Metal", 200), opt("hidden", "Hidden placket", 200)]),
  fit:           group("fit", "Fit", [opt("slim", "Slim"), opt("regular", "Regular"), opt("relaxed", "Relaxed")]),
  fitWomen:      group("fit", "Fit", [opt("slim", "Slim"), opt("regular", "Regular"), opt("wide", "Wide leg", 200)]),
  hoodStyle:     group("style", "Style", [opt("pullover", "Pullover"), opt("zip", "Zip-up", 300)]),
  closure:       group("closure", "Closure", [opt("buttons", "Buttons"), opt("zip", "Zip")]),
  waist:         group("waist", "Waist", [opt("belt", "Belt loops"), opt("elastic", "Elastic")]),
  trouserLength: group("length", "Length", [opt("full", "Full"), opt("ankle", "Ankle")]),
  dressLength:   group("length", "Length", [opt("knee", "Knee"), opt("midi", "Midi", 200), opt("maxi", "Maxi", 500)]),
  skirtLength:   group("length", "Length", [opt("mini", "Mini"), opt("knee", "Knee"), opt("midi", "Midi", 200), opt("maxi", "Maxi", 400)]),
  skirtStyle:    group("style", "Style", [opt("aline", "A-line"), opt("pencil", "Pencil"), opt("pleated", "Pleated", 400)]),
  kurtaLength:   group("length", "Length", [opt("hip", "Hip"), opt("knee", "Knee", 200)]),
  belt:          group("belt", "Belt", [opt("none", "None"), opt("tie", "Tie belt", 200)]),
  train:         group("train", "Train", [opt("none", "None"), opt("short", "Short train", 800), opt("long", "Long train", 1500)]),
};

const label = (id: string) =>
  id.replace(/_L$/, " (left)").replace(/_R$/, " (right)").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

const sizeFor = (id: string): [number, number] =>
  /trim|belt|waistband|rib|cuff|placket|collar|buttons/.test(id) ? [1024, 256]
  : /sleeve|pocket|hood|yoke|leg|train/.test(id) ? [1024, 1024]
  : [2048, 2048];

const MIRROR = /^(sleeve|cuff|pocket|leg)_R$/;

function mk(slug: string, name: string, gender: "men" | "women", ids: string[], variants: VariantGroup[], basePriceCents: number): GarmentDef {
  const panels: Panel[] = ids.map((id) => {
    const mirrored = MIRROR.test(id) && ids.includes(id.replace(/_R$/, "_L"));
    const src = mirrored ? id.replace(/_R$/, "_L") : id;
    return {
      id, label: label(id), size: sizeFor(id), outline: `/patterns/${gender}/${slug}/${src}.svg`,
      mirrorOf: mirrored ? src : undefined, allowPrint: !/trim|belt|waistband|rib|cuff|placket|buttons/.test(id),
    };
  });
  return { slug, name, gender, model: `/models/${gender}/${slug}.glb`, basePriceCents: basePriceCents * LKR_RATE, panels, variants };
}

const TOP = ["front", "back", "sleeve_L", "sleeve_R"];
const SHIRT = ["front_L", "front_R", "back", "yoke", "sleeve_L", "sleeve_R", "cuff_L", "cuff_R", "collar", "pocket_L"];
const DRESS = ["bodice_front", "bodice_back", "skirt_front", "skirt_back", "sleeve_L", "sleeve_R", "neckline_trim"];
const BOTTOM = ["leg_L", "leg_R", "waistband", "pocket_L", "pocket_R"];

export const GARMENTS: GarmentDef[] = [
  // ---------- MEN ----------
  mk("mens-tshirt", "T-shirt", "men", [...TOP, "collar"], [V.sleeveMen, V.necklineMen, V.pocket], 2500),
  mk("mens-polo", "Polo shirt", "men", [...TOP, "collar", "placket", "buttons"], [V.sleeveMen, V.pocket, V.buttons], 3200),
  mk("mens-shirt", "Shirt", "men", [...SHIRT, "buttons"], [V.sleeveMen, V.collar, V.pocket, V.buttons], 4200),
  mk("mens-hoodie", "Hoodie", "men", [...TOP, "hood", "pocket", "rib"], [V.hoodStyle, V.fit], 4500),
  mk("mens-sweatshirt", "Sweatshirt", "men", [...TOP, "rib"], [V.necklineMen, V.fit], 3800),
  mk("mens-jacket", "Jacket", "men", ["front_L", "front_R", "back", "sleeve_L", "sleeve_R", "collar", "pocket_L", "pocket_R", "buttons"], [V.collar, V.closure, V.pocket, V.buttons], 7500),
  mk("mens-trouser", "Trouser", "men", BOTTOM, [V.fit, V.trouserLength, V.waist], 4800),
  mk("mens-shorts", "Shorts", "men", BOTTOM, [V.fit, V.waist], 3000),
  mk("mens-kurta", "Kurta", "men", [...TOP, "collar", "placket", "buttons"], [V.sleeveMen, V.collar, V.kurtaLength, V.buttons], 4400),
  // ---------- WOMEN ----------
  mk("womens-dress-aline", "A-line dress", "women", [...DRESS, "belt"], [V.sleeveWomen, V.necklineWomen, V.dressLength, V.belt], 6500),
  mk("womens-dress-bodycon", "Bodycon dress", "women", DRESS, [V.sleeveWomen, V.necklineWomen], 6000),
  mk("womens-dress-maxi", "Maxi dress", "women", [...DRESS, "belt"], [V.sleeveWomen, V.necklineWomen, V.belt], 7200),
  mk("womens-dress-midi", "Midi dress", "women", [...DRESS, "belt"], [V.sleeveWomen, V.necklineWomen, V.belt], 6800),
  mk("womens-dress-wrap", "Wrap dress", "women", ["wrap_front_L", "wrap_front_R", "bodice_back", "skirt_back", "sleeve_L", "sleeve_R", "belt"], [V.sleeveWomen, V.dressLength], 7000),
  mk("womens-dress-shirt", "Shirt dress", "women", ["front_L", "front_R", "back", "yoke", "skirt", "sleeve_L", "sleeve_R", "cuff_L", "cuff_R", "collar", "belt", "buttons"], [V.sleeveWomen, V.collar, V.dressLength, V.belt, V.buttons], 7000),
  mk("womens-gown", "Gown", "women", [...DRESS, "train", "belt"], [V.sleeveWomen, V.necklineWomen, V.train, V.belt], 12000),
  mk("womens-blouse", "Blouse", "women", [...TOP, "collar", "neckline_trim", "buttons"], [V.sleeveWomen, V.necklineWomen, V.collar, V.buttons], 3800),
  mk("womens-top", "Top", "women", TOP, [V.sleeveWomen, V.necklineWomen], 2800),
  mk("womens-hoodie", "Hoodie", "women", [...TOP, "hood", "pocket", "rib"], [V.hoodStyle, V.fit], 4500),
  mk("womens-skirt", "Skirt", "women", ["skirt_front", "skirt_back", "waistband"], [V.skirtStyle, V.skirtLength], 3500),
  mk("womens-trouser", "Trouser", "women", BOTTOM, [V.fitWomen, V.trouserLength, V.waist], 4800),
  mk("womens-jumpsuit", "Jumpsuit", "women", ["bodice_front", "bodice_back", "leg_L", "leg_R", "sleeve_L", "sleeve_R", "belt"], [V.sleeveWomen, V.necklineWomen, V.belt], 8000),
  mk("womens-kurti", "Kurti", "women", [...TOP, "neckline_trim", "placket", "buttons"], [V.sleeveWomen, V.necklineWomen, V.kurtaLength, V.buttons], 4200),
];

export const getGarment = (slug: string) => GARMENTS.find((g) => g.slug === slug);

/** Display-only estimate. The SERVER price is the only price that is charged. Keep in sync with DesignPricer.php. */
export function estimatePriceCents(g: GarmentDef, panels: Record<string, { fabric: string; layers: unknown[] }>, variants: Record<string, string>) {
  let total = g.basePriceCents;
  for (const grp of g.variants) {
    const chosen = variants[grp.key] ?? grp.options[0].id;
    total += grp.options.find((o) => o.id === chosen)?.priceDeltaCents ?? 0;
  }
  const used = new Set(Object.values(panels).map((p) => p.fabric));
  used.forEach((f) => { total += FABRICS[f]?.priceDeltaCents ?? 0; });
  const printed = Object.values(panels).filter((p) => p.layers.length > 0).length;
  return total + Math.min(printed * 60000, 300000);
}
