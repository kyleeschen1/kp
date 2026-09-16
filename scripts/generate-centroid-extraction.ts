import { readFileSync, writeFileSync } from "node:fs";
import { compileCentroidExtraction } from "./centroid-extraction-frontend.ts";
const before = readFileSync("examples/programming/centroid-before.ts", "utf8");
const after = readFileSync("examples/programming/centroid-after.ts", "utf8");
const result = compileCentroidExtraction(before, after);
if (result.status !== "accepted") throw new Error(JSON.stringify(result.diagnostics));
const path = "src/semantic/centroid-extraction.generated.json";
const output = JSON.stringify(result.artifact, null, 2) + "\n";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8") !== output) throw new Error("Centroid evidence is stale; regenerate it after source review");
} else writeFileSync(path, output);
