import { readFile, writeFile } from "node:fs/promises";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog-builder.ts";
import {
  createKpEquationAssetManifest,
  deriveKpAnimationDisplayCatalogueFromEquationManifest
} from "../src/architecture/equation-asset-manifest.ts";

const target = new URL(
  "../src/editor/animation-library-display-catalog.generated.json",
  import.meta.url
);
const source = createKpAnimationLibraryDisplayCatalog();
const output = `${JSON.stringify(
  deriveKpAnimationDisplayCatalogueFromEquationManifest({
    source,
    manifest: createKpEquationAssetManifest({ display: source })
  }),
  null,
  2
)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Animation Library display metadata is stale. Run " +
      "npm run generate:animation-library-display-catalog."
    );
  }
  console.log("animation library display metadata is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated animation library display catalog");
}
