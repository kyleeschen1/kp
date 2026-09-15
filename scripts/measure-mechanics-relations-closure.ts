import { readFile } from "node:fs/promises";
import { collectKpBundleManifestFiles, measureKpBundleClosureAttribution, type KpBundleManifest } from "./bundle-closure-attribution.ts";

const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8")) as KpBundleManifest;
const roots = ["experiments/mechanics-relations/index.html"];
const initial = await measureKpBundleClosureAttribution("dist", collectKpBundleManifestFiles(manifest, roots));
const activated = await measureKpBundleClosureAttribution("dist", collectKpBundleManifestFiles(manifest, roots, true));
// Reachable JS/CSS transfer, not a device benchmark or an observed network trace.
console.log(JSON.stringify({ initial, activated, additionalActivationGzipBytes: activated.gzipBytes - initial.gzipBytes,
  excludes: ["HTML", "fonts", "images", "HTTP overhead", "parse/execute/paint cost"] }, null, 2));
