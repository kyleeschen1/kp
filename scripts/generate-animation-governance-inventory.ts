import { readFile, writeFile } from "node:fs/promises";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpAnimationGovernanceInventory
} from "../src/architecture/animation-governance-inventory.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarationSet
} from "../src/editor/selected-surface-capability-declarations.ts";

const target = new URL(
  "../src/architecture/animation-governance-inventory.generated.json",
  import.meta.url
);
const descriptors = createKpEditorAnimationLibrary();
const output = `${JSON.stringify(compileKpAnimationGovernanceInventory({
  assets: createKpAnimationAssets(),
  catalogue: createKpAnimationCatalogueProjection({ descriptors }),
  descriptors,
  capabilityDeclarations: kpEditorSelectedSurfaceCapabilityDeclarationSet
}), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Animation governance inventory is stale. Run " +
      "npm run generate:animation-governance-inventory."
    );
  }
  console.log("animation governance inventory is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated animation governance inventory");
}
