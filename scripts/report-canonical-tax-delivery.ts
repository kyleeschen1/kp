import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { collectKpViteManifestStaticClosure, type KpViteManifest } from "./vite-manifest-closure.ts";
import { measureKpBundleClosureAttribution } from "./bundle-closure-attribution.ts";

const entry = "experiments/kinetic-figure/supply-tax/index.html";
const manifest = JSON.parse(await readFile("dist/.vite/manifest.json", "utf8")) as KpViteManifest;
const closure = collectKpViteManifestStaticClosure(manifest, [entry]);
const runtime = await measureKpBundleClosureAttribution("dist",
  closure.resources.filter(resource => /\.(js|css)$/.test(resource.file)).map(resource => resource.file));
const html = await readFile(`dist/${entry}`);
// Measurement only: this newly delivered route has no invented or relaxed budget.
// Static JS/CSS closure excludes fonts, images and later dynamic activations.
console.log(JSON.stringify({
  route: "/experiments/kinetic-figure/supply-tax/",
  htmlRawBytes: html.byteLength,
  htmlGzipBytes: gzipSync(html).byteLength,
  staticCodeGzipBytes: runtime.gzipBytes,
  staticCodeFiles: runtime.files.length,
  largestCodeFiles: [...runtime.files].sort((a, b) => b.gzipBytes - a.gzipBytes).slice(0, 5),
  discoverableDynamicRoots: closure.discoverableDynamicRoots.length,
  scope: "Static JS/CSS only; not full wire transfer, activation cost or a frame-rate claim."
}, null, 2));
