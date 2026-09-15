import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { collectKpBundleManifestFiles, measureKpBundleClosureAttribution, type KpBundleManifest } from "./bundle-closure-attribution.ts";

const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8")) as KpBundleManifest;
const entries = new Map([
  ["physics", "experiments/mechanics-relations/index.html"],
  ["scalar", "experiments/scalar-cancellation/index.html"]
]);
const entry = process.argv[2] ?? "physics";
const root = entries.get(entry);
if (!root) throw new Error("Choose physics or scalar for the bounded reader closure measurement");
const roots = [root];
const initial = await measureKpBundleClosureAttribution("dist", collectKpBundleManifestFiles(manifest, roots));
const activated = await measureKpBundleClosureAttribution("dist", collectKpBundleManifestFiles(manifest, roots, true));
const html = await readFile(`dist/${root}`);
// Reachable JS/CSS transfer, not a device benchmark or an observed network trace.
console.log(JSON.stringify({ entry, initial, activated, html: { bytes: html.byteLength, gzipBytes: gzipSync(html).byteLength },
  additionalActivationGzipBytes: activated.gzipBytes - initial.gzipBytes,
  excludes: ["fonts", "images", "HTTP overhead", "parse/execute/paint cost"] }, null, 2));
