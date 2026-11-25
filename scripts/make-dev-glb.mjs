// scripts/make-dev-glb.mjs
// Generates one simple box-based GLB per garment for local development.
// Each GLB has one mesh per panel with a correctly-named material and
// one node per variant option named  var__{key}__{optionId}.
// Run: node scripts/make-dev-glb.mjs
//
// Requires: npm i -D @gltf-transform/core (at repo root)

import { Document, NodeIO } from "@gltf-transform/core";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

// Inline the garment slugs + panels from the TypeScript registry
// (duplicated here as plain JS so we don't need tsx for a build-time asset script)
const TOP = ["front", "back", "sleeve_L", "sleeve_R"];
const SHIRT = ["front_L", "front_R", "back", "yoke", "sleeve_L", "sleeve_R", "cuff_L", "cuff_R", "collar", "pocket_L"];
const DRESS = ["bodice_front", "bodice_back", "skirt_front", "skirt_back", "sleeve_L", "sleeve_R", "neckline_trim"];
const BOTTOM = ["leg_L", "leg_R", "waistband", "pocket_L", "pocket_R"];

/** @type {Array<{slug: string; gender: string; panels: string[]; variants: Array<{key:string; options:string[]}>}>} */
const GARMENTS = [
  { slug: "mens-tshirt",          gender: "men",   panels: [...TOP, "collar"],       variants: [{key:"sleeve",options:["half","full"]},{key:"neckline",options:["round","v"]},{key:"pocket",options:["none","chest","flap","double"]}] },
  { slug: "mens-polo",            gender: "men",   panels: [...TOP, "collar","placket","buttons"], variants: [{key:"sleeve",options:["half","full"]},{key:"pocket",options:["none","chest","flap","double"]},{key:"buttons",options:["standard","contrast","metal","hidden"]}] },
  { slug: "mens-shirt",           gender: "men",   panels: [...SHIRT,"buttons"],     variants: [{key:"sleeve",options:["half","full"]},{key:"collar",options:["classic","mandarin","buttondown"]},{key:"pocket",options:["none","chest","flap","double"]},{key:"buttons",options:["standard","contrast","metal","hidden"]}] },
  { slug: "mens-hoodie",          gender: "men",   panels: [...TOP,"hood","pocket","rib"], variants: [{key:"style",options:["pullover","zip"]},{key:"fit",options:["slim","regular","relaxed"]}] },
  { slug: "mens-sweatshirt",      gender: "men",   panels: [...TOP,"rib"],           variants: [{key:"neckline",options:["round","v"]},{key:"fit",options:["slim","regular","relaxed"]}] },
  { slug: "mens-jacket",          gender: "men",   panels: ["front_L","front_R","back","sleeve_L","sleeve_R","collar","pocket_L","pocket_R","buttons"], variants: [{key:"collar",options:["classic","mandarin","buttondown"]},{key:"closure",options:["buttons","zip"]},{key:"pocket",options:["none","chest","flap","double"]},{key:"buttons",options:["standard","contrast","metal","hidden"]}] },
  { slug: "mens-trouser",         gender: "men",   panels: BOTTOM,                  variants: [{key:"fit",options:["slim","regular","relaxed"]},{key:"length",options:["full","ankle"]},{key:"waist",options:["belt","elastic"]}] },
  { slug: "mens-shorts",          gender: "men",   panels: BOTTOM,                  variants: [{key:"fit",options:["slim","regular","relaxed"]},{key:"waist",options:["belt","elastic"]}] },
  { slug: "mens-kurta",           gender: "men",   panels: [...TOP,"collar","placket","buttons"], variants: [{key:"sleeve",options:["half","full"]},{key:"collar",options:["classic","mandarin","buttondown"]},{key:"length",options:["hip","knee"]},{key:"buttons",options:["standard","contrast","metal","hidden"]}] },
  { slug: "womens-dress-aline",   gender: "women", panels: [...DRESS,"belt"],        variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]},{key:"length",options:["knee","midi","maxi"]},{key:"belt",options:["none","tie"]}] },
  { slug: "womens-dress-bodycon", gender: "women", panels: DRESS,                   variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]}] },
  { slug: "womens-dress-maxi",    gender: "women", panels: [...DRESS,"belt"],        variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]},{key:"belt",options:["none","tie"]}] },
  { slug: "womens-dress-midi",    gender: "women", panels: [...DRESS,"belt"],        variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]},{key:"belt",options:["none","tie"]}] },
  { slug: "womens-dress-wrap",    gender: "women", panels: ["wrap_front_L","wrap_front_R","bodice_back","skirt_back","sleeve_L","sleeve_R","belt"], variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"length",options:["knee","midi","maxi"]}] },
  { slug: "womens-dress-shirt",   gender: "women", panels: ["front_L","front_R","back","yoke","skirt","sleeve_L","sleeve_R","cuff_L","cuff_R","collar","belt","buttons"], variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"collar",options:["classic","mandarin","buttondown"]},{key:"length",options:["knee","midi","maxi"]},{key:"belt",options:["none","tie"]},{key:"buttons",options:["standard","contrast","metal","hidden"]}] },
  { slug: "womens-gown",          gender: "women", panels: [...DRESS,"train","belt"], variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]},{key:"train",options:["none","short","long"]},{key:"belt",options:["none","tie"]}] },
  { slug: "womens-blouse",        gender: "women", panels: [...TOP,"collar","neckline_trim","buttons"], variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]},{key:"collar",options:["classic","mandarin","buttondown"]},{key:"buttons",options:["standard","contrast","metal","hidden"]}] },
  { slug: "womens-top",           gender: "women", panels: TOP,                     variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]}] },
  { slug: "womens-hoodie",        gender: "women", panels: [...TOP,"hood","pocket","rib"], variants: [{key:"style",options:["pullover","zip"]},{key:"fit",options:["slim","regular","relaxed"]}] },
  { slug: "womens-skirt",         gender: "women", panels: ["skirt_front","skirt_back","waistband"], variants: [{key:"style",options:["aline","pencil","pleated"]},{key:"length",options:["mini","knee","midi","maxi"]}] },
  { slug: "womens-trouser",       gender: "women", panels: BOTTOM,                  variants: [{key:"fit",options:["slim","regular","wide"]},{key:"length",options:["full","ankle"]},{key:"waist",options:["belt","elastic"]}] },
  { slug: "womens-jumpsuit",      gender: "women", panels: ["bodice_front","bodice_back","leg_L","leg_R","sleeve_L","sleeve_R","belt"], variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]},{key:"belt",options:["none","tie"]}] },
  { slug: "womens-kurti",         gender: "women", panels: [...TOP,"neckline_trim","placket","buttons"], variants: [{key:"sleeve",options:["sleeveless","short","threeq","full"]},{key:"neckline",options:["round","v","boat","square"]},{key:"length",options:["hip","knee"]},{key:"buttons",options:["standard","contrast","metal","hidden"]}] },
];

const io = new NodeIO();

// Simple box mesh: 4 vertices, 2 triangles
const BOX_POS = new Float32Array([
  -0.5, -0.5, 0,  0.5, -0.5, 0,
   0.5,  0.5, 0, -0.5,  0.5, 0,
]);
const BOX_UV = new Float32Array([0,0, 1,0, 1,1, 0,1]);
const BOX_IDX = new Uint16Array([0,1,2, 0,2,3]);

for (const g of GARMENTS) {
  const doc = new Document();
  const buf = doc.createBuffer(); // required by gltf-transform v4+
  const scene = doc.createScene();
  const root = doc.createNode("root");
  scene.addChild(root);

  // Panel meshes
  for (let i = 0; i < g.panels.length; i++) {
    const pieceId = g.panels[i];
    const mat = doc.createMaterial(pieceId).setBaseColorFactor([1, 1, 1, 1]);
    const prim = doc.createPrimitive()
      .setMaterial(mat)
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(BOX_POS).setBuffer(buf))
      .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(BOX_UV).setBuffer(buf))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(BOX_IDX).setBuffer(buf));
    const mesh = doc.createMesh(pieceId).addPrimitive(prim);
    const node = doc.createNode(pieceId)
      .setMesh(mesh)
      .setTranslation([i * 0.1, 0, 0]);
    root.addChild(node);
  }

  // Variant nodes (one per option; first is visible, rest hidden via extras flag — viewer handles visibility)
  for (const v of g.variants) {
    for (const opt of v.options) {
      const varNode = doc.createNode(`var__${v.key}__${opt}`);
      root.addChild(varNode);
    }
  }

  const outDir = `apps/web/public/models/${g.gender}`;
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${g.slug}.glb`);
  await io.write(outPath, doc);
  console.log(`Generated ${outPath}`);
}

console.log("\nDev GLBs generated. Replace with real assets before production.");
