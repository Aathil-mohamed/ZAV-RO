// scripts/check-assets.ts
// Run: npx tsx scripts/check-assets.ts
// Validates that every garment in the registry has its GLB, all piece materials, variant nodes, outline SVGs, and size < 3 MB.
import { NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { existsSync, statSync } from "fs";
import { GARMENTS } from "../apps/web/lib/garments";

async function main() {
const io = new NodeIO()
  .registerExtensions([KHRDracoMeshCompression])
  .registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });

let failed = 0;
const rows: string[] = [];

for (const g of GARMENTS) {
  const file = `apps/web/public${g.model}`;
  if (!existsSync(file)) {
    const msg = `FAIL ${g.slug}: missing ${file}`;
    console.log(msg); rows.push(msg); failed++; continue;
  }

  const sizeBytes = statSync(file).size;
  const errs: string[] = [];

  if (sizeBytes > 3_000_000) errs.push(`GLB too large (${(sizeBytes / 1e6).toFixed(1)} MB > 3 MB)`);

  const doc = await io.read(file);
  const mats = new Set(doc.getRoot().listMaterials().map((m) => m.getName()));
  const nodes = new Set(doc.getRoot().listNodes().map((n) => n.getName()));

  g.panels.forEach((p) => {
    if (!mats.has(p.id)) errs.push(`material "${p.id}" missing`);
    if (!p.mirrorOf) {
      const svg = `apps/web/public${p.outline}`;
      if (!existsSync(svg)) errs.push(`outline SVG missing: ${p.outline}`);
    }
  });

  g.variants.forEach((v) =>
    v.options.forEach((o) => {
      if (!nodes.has(`var__${v.key}__${o.id}`)) errs.push(`node var__${v.key}__${o.id} missing`);
    }),
  );

  const result = errs.length ? `FAIL ${g.slug}: ${errs.join("; ")}` : `PASS ${g.slug}`;
  console.log(result); rows.push(result);
  if (errs.length) failed++;
}

console.log(`\n${failed === 0 ? "All assets PASS" : `${failed} garment(s) FAILED`}`);
process.exit(failed ? 1 : 0);
}

main().catch((err) => { console.error(err); process.exit(1); });
