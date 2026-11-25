// scripts/export-registry.ts   run: npx tsx scripts/export-registry.ts
import { writeFileSync } from "fs";
import { GARMENTS, FABRICS } from "../apps/web/lib/garments";
writeFileSync("apps/api/resources/registry.json", JSON.stringify({ garments: GARMENTS, fabrics: FABRICS }, null, 2));
console.log("registry.json written to apps/api/resources/");
