import { readFile, writeFile } from "node:fs/promises";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpAnimationConformanceManifestSet
} from "../src/architecture/animation-conformance-manifest.ts";
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
  "../src/architecture/animation-conformance-manifest.generated.json",
  import.meta.url
);
const assets = createKpAnimationAssets();
const descriptors = createKpEditorAnimationLibrary();
const inventory = compileKpAnimationGovernanceInventory({
  assets,
  catalogue: createKpAnimationCatalogueProjection({ descriptors }),
  descriptors,
  capabilityDeclarations: kpEditorSelectedSurfaceCapabilityDeclarationSet
});
const output = `${JSON.stringify(compileKpAnimationConformanceManifestSet({
  assets,
  inventory
}), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Animation conformance manifest is stale. Run " +
      "npm run generate:animation-conformance-manifest."
    );
  }
  console.log("animation conformance manifest is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated animation conformance manifest");
}
