import { readFile } from "node:fs/promises";
import { collectKpBundleManifestFiles, measureKpBundleClosureAttribution, type KpBundleManifest } from "./bundle-closure-attribution.ts";

const root = "dist/symbolic-inspection";
const manifest = JSON.parse(await readFile(`${root}/.vite/manifest.json`, "utf8")) as KpBundleManifest;
const entry = "src/experiments/authoring-distribution-focus-card/entry.ts";
const initial = await measureKpBundleClosureAttribution(root, collectKpBundleManifestFiles(manifest, [entry]));
const activated = await measureKpBundleClosureAttribution(root, collectKpBundleManifestFiles(manifest, [entry], true));
console.log(JSON.stringify({ entry, initial, activated,
  excludes: ["HTML", "KaTeX stylesheet loaded by host", "fonts", "images", "prepared API payload", "server preparation", "HTTP overhead", "execution and paint"] }, null, 2));
