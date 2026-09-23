import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { collectKpHtmlBundleFiles, measureKpBundleClosureAttribution, type KpBundleManifest } from "./bundle-closure-attribution.ts";

const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8")) as KpBundleManifest;
const entries = new Map([
  ["code", "experiments/code-reasoning/index.html"],
  ["centroid", "experiments/centroid-reasoning/index.html"],
  ["physics", "experiments/mechanics-relations/index.html"],
  ["physics-argument", "experiments/mechanics-relations/force-without-work/index.html"],
  ["scalar", "experiments/scalar-cancellation/index.html"],
  ["fraction", "experiments/fraction-chain/index.html"],
  ["fraction-numeric", "experiments/fraction-chain/numeric/index.html"],
  ["fraction-two-sided", "experiments/fraction-chain/two-sided/index.html"],
  ["fraction-subtraction", "experiments/fraction-chain/subtraction/index.html"]
]);
const entry = process.argv[2] ?? "physics";
const root = entries.get(entry);
if (!root) throw new Error(`Choose one of ${[...entries.keys()].join(", ")} for the bounded reader closure measurement`);
const html = await readFile(`dist/${root}`);
const initial = await measureKpBundleClosureAttribution("dist", collectKpHtmlBundleFiles(html.toString("utf8"), manifest));
const activated = await measureKpBundleClosureAttribution("dist", collectKpHtmlBundleFiles(html.toString("utf8"), manifest, true));
// Reachable JS/CSS transfer, not a device benchmark or an observed network trace.
const summary = process.argv.includes("--summary");
console.log(JSON.stringify({ entry, initial: summary ? { gzipBytes: initial.gzipBytes, fileCount: initial.files.length } : initial,
  activated: summary ? { gzipBytes: activated.gzipBytes, fileCount: activated.files.length } : activated,
  html: { bytes: html.byteLength, gzipBytes: gzipSync(html).byteLength },
  additionalActivationGzipBytes: activated.gzipBytes - initial.gzipBytes,
  excludes: ["fonts", "images", "HTTP overhead", "parse/execute/paint cost"] }, null, 2));
