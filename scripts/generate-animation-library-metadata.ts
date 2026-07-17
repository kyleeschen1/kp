import { writeFile } from "node:fs/promises";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createSymbolicManipulationFamilyRegistry
} from "../src/animation/symbolic-manipulation-family-registry.ts";
import {
  projectKpAnimationAssetsToEditorDescriptors
} from "../src/editor/animation-catalog-projection.ts";

const descriptors = projectKpAnimationAssetsToEditorDescriptors({
  assets: createKpAnimationAssets(),
  families: createSymbolicManipulationFamilyRegistry()
});
const output = `${JSON.stringify(descriptors, null, 2)}\n`;

await writeFile(
  new URL("../src/editor/animation-library-metadata.generated.json", import.meta.url),
  output,
  "utf8"
);

console.log(`generated ${descriptors.length} animation library descriptors`);
