import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpBundleExperienceScenario
} from "./bundle-experience-scenario.ts";
import {
  collectKpViteManifestExperienceClosure,
  collectKpViteManifestStaticClosure,
  differenceKpViteManifestClosures,
  type KpViteManifest
} from "./vite-manifest-closure.ts";

const manifest: KpViteManifest = {
  "entry.ts": {
    file: "assets/entry.js",
    src: "entry.ts",
    imports: ["shared.ts"],
    dynamicImports: ["pack.ts"],
    css: ["assets/entry.css"],
    assets: ["assets/reader.woff2"]
  },
  "shared.ts": {
    file: "assets/shared.js",
    src: "shared.ts",
    css: ["assets/shared.css"]
  },
  "pack.ts": {
    file: "assets/pack.js",
    src: "pack.ts",
    imports: ["shared.ts"],
    dynamicImports: ["renderer.ts"]
  },
  "renderer.ts": {
    file: "assets/renderer.js",
    src: "renderer.ts",
    assets: ["assets/grid.svg"]
  }
};

test("static manifest closure includes owned resources but not dynamic chunks", () => {
  const closure = collectKpViteManifestStaticClosure(manifest, ["entry.ts"]);

  assert.deepEqual(closure.chunkKeys, ["entry.ts", "shared.ts"]);
  assert.deepEqual(
    closure.resources.map(({ file, kind }) => ({ file, kind })),
    [
      { file: "assets/entry.css", kind: "style" },
      { file: "assets/entry.js", kind: "script" },
      { file: "assets/reader.woff2", kind: "font" },
      { file: "assets/shared.css", kind: "style" },
      { file: "assets/shared.js", kind: "script" }
    ]
  );
  assert.deepEqual(closure.discoverableDynamicRoots, ["pack.ts"]);
  assert.ok(Object.isFrozen(closure.resources));
});

test("experience closure activates only declared dynamic roots in order", () => {
  const scenario = defineKpBundleExperienceScenario({
    id: "bundle-experience.synthetic",
    title: "Synthetic",
    entryRoots: ["entry.ts"],
    activations: [
      { id: "pack", manifestRoots: ["pack.ts"] },
      { id: "renderer", manifestRoots: ["renderer.ts"] }
    ],
    expectedOwners: ["renderer.ts"],
    forbiddenOwners: [],
    budgets: []
  });
  const closure = collectKpViteManifestExperienceClosure(manifest, scenario);

  assert.deepEqual(
    closure.activations[0]!.incremental.resources.map(({ file }) => file),
    ["assets/pack.js"]
  );
  assert.deepEqual(
    closure.activations[1]!.incremental.resources.map(({ file }) => file),
    ["assets/grid.svg", "assets/renderer.js"]
  );
  assert.deepEqual(closure.experience.chunkKeys, [
    "entry.ts",
    "pack.ts",
    "renderer.ts",
    "shared.ts"
  ]);
  assert.deepEqual(closure.experience.discoverableDynamicRoots, []);
});

test("experience closure rejects an activation not discoverable from current state", () => {
  const scenario = defineKpBundleExperienceScenario({
    id: "bundle-experience.invalid",
    title: "Invalid",
    entryRoots: ["entry.ts"],
    activations: [{ id: "renderer", manifestRoots: ["renderer.ts"] }],
    expectedOwners: [],
    forbiddenOwners: [],
    budgets: []
  });

  assert.throws(
    () => collectKpViteManifestExperienceClosure(manifest, scenario),
    /cannot reach undeclared dynamic root renderer\.ts/
  );
  assert.throws(
    () => collectKpViteManifestStaticClosure(manifest, ["missing.ts"]),
    /lacks chunk missing\.ts/
  );
});

test("closure differences compare emitted resources rather than owner aliases", () => {
  const entry = collectKpViteManifestStaticClosure(manifest, ["entry.ts"]);
  const pack = collectKpViteManifestStaticClosure(manifest, ["pack.ts"]);
  const difference = differenceKpViteManifestClosures(pack, entry);

  assert.deepEqual(difference.chunkKeys, ["pack.ts"]);
  assert.deepEqual(difference.resources.map(({ file }) => file), [
    "assets/pack.js"
  ]);
});
