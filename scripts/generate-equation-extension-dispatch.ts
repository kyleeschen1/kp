import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  renderKpEquationExtensionDispatchSource
} from "./equation-extension-dispatch-generator.ts";
import {
  createKpEquationExtensionDispatchManifest
} from "./equation-extension-dispatch-manifest.ts";

const outputPath = resolve(
  "src/generated/equation-extension-dispatch.generated.ts"
);
const source = renderKpEquationExtensionDispatchSource(
  createKpEquationExtensionDispatchManifest()
);

if (process.argv.includes("--check")) {
  const existing = readFileSync(outputPath, "utf8");
  if (existing !== source) {
    throw new Error("Generated equation extension dispatch is stale.");
  }
} else {
  writeFileSync(outputPath, source);
}
