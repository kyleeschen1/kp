import { readFile, writeFile } from "node:fs/promises";
import {
  createKpEquationAssetManifest
} from "../src/architecture/equation-asset-manifest.ts";

const target = new URL(
  "../src/architecture/equation-asset-manifest.generated.json",
  import.meta.url
);
const output = `${JSON.stringify(createKpEquationAssetManifest(), null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = await readFile(target, "utf8").catch(() => "");
  if (current !== output) {
    throw new Error(
      "Equation asset manifest is stale. Run " +
      "npm run generate:equation-asset-manifest."
    );
  }
  console.log("equation asset manifest is current");
} else {
  await writeFile(target, output, "utf8");
  console.log("generated equation asset manifest");
}
