import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { defineKpBundleExperienceScenario } from "./bundle-experience-scenario.ts";
import { collectKpViteManifestExperienceClosure, type KpViteManifest, type KpViteManifestClosure } from "./vite-manifest-closure.ts";

const dist = resolve("dist/gradient-contour");
const manifest = JSON.parse(await readFile(resolve(dist, ".vite/manifest.json"), "utf8")) as KpViteManifest;
const scenario = defineKpBundleExperienceScenario({
  id: "bundle-experience.gradient-contour.v1", buildId: "bundle-build.gradient-contour.v1",
  title: "Gradient authoring, readings and activated canonical WebGL stage",
  entryRoots: ["experiments/kinetic-figure/gradient-contour/index.html"],
  activations: [{ id: "canonical-webgl", manifestRoots: ["src/rendering/graph-webgl-three.ts"] }],
  expectedOwners: [], forbiddenOwners: [], budgets: []
});
const closure = collectKpViteManifestExperienceClosure(manifest, scenario);
async function measure(value: KpViteManifestClosure) {
  const resources = await Promise.all(value.resources.map(async resource => {
    const bytes = await readFile(resolve(dist, resource.file));
    return { file: resource.file, kind: resource.kind, rawBytes: bytes.length, gzipBytes: gzipSync(bytes).length };
  }));
  const totals = Object.fromEntries(["script", "style", "font", "asset"].map(kind => [kind,
    resources.filter(resource => resource.kind === kind).reduce((sum, resource) => sum + resource.gzipBytes, 0)]));
  return { files: resources.length, gzipBytesByKind: totals, resources };
}
// Report complete activation cost, not a small entry chunk that hides WebGL.
// This is measurement evidence, not an invented or automatically raised ceiling.
console.log(JSON.stringify({ scenario: scenario.id, entry: await measure(closure.entry),
  experience: await measure(closure.experience) }, null, 2));
