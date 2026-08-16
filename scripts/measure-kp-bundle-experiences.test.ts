import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { gzipSync } from "node:zlib";

import { defineKpBundleExperienceScenario } from
  "./bundle-experience-scenario.ts";
import { measureKpBundleExperienceScenarios } from
  "./measure-kp-bundle-experiences.ts";
import {
  includeKpBundleScenarioComparisonBases,
  summarizeKpBundleExperienceMeasurement
} from
  "./measure-kp-bundle-experiences.ts";

test("scenario measurement reports deterministic resource and incremental sizes", async () => {
  const root = await mkdtemp(join(tmpdir(), "kp-bundle-scenario-"));
  const output = join(root, "dist");
  await mkdir(join(output, ".vite"), { recursive: true });
  await mkdir(join(output, "assets"), { recursive: true });
  const manifest = {
    "entry.ts": {
      file: "assets/entry.js",
      src: "entry.ts",
      dynamicImports: ["pack.ts"]
    },
    "pack.ts": {
      file: "assets/pack.js",
      src: "pack.ts",
      css: ["assets/pack.css"]
    }
  };
  await writeFile(
    join(output, ".vite/manifest.json"),
    JSON.stringify(manifest),
    "utf8"
  );
  await writeFile(join(output, "assets/entry.js"), "entry", "utf8");
  await writeFile(join(output, "assets/pack.js"), "pack", "utf8");
  await writeFile(join(output, "assets/pack.css"), "style", "utf8");
  const base = defineKpBundleExperienceScenario({
    id: "bundle-experience.synthetic.base",
    title: "Base",
    buildId: "bundle-build.main",
    entryRoots: ["entry.ts"],
    activations: [],
    expectedOwners: ["entry.ts"],
    forbiddenOwners: ["pack.ts"],
    budgets: []
  });
  const selected = defineKpBundleExperienceScenario({
    id: "bundle-experience.synthetic.selected",
    title: "Selected",
    buildId: "bundle-build.main",
    entryRoots: ["entry.ts"],
    activations: [{ id: "pack", manifestRoots: ["pack.ts"] }],
    comparisonBaseId: base.id,
    expectedOwners: ["pack.ts"],
    forbiddenOwners: [],
    budgets: [{ phase: "incremental", resource: "total", gzipBytes: 100 }]
  });
  const report = await measureKpBundleExperienceScenarios({
    scenarios: [base, selected],
    projectRoot: root
  });
  const measurement = report.scenarios[1]!;

  assert.equal(
    measurement.incremental?.script,
    gzipSync("pack").byteLength
  );
  assert.equal(
    measurement.incremental?.style,
    gzipSync("style").byteLength
  );
  assert.deepEqual(measurement.ownerViolations, []);
  assert.deepEqual(measurement.budgetViolations, []);
  assert.deepEqual(
    measurement.files.map(({ file }) => file),
    ["assets/entry.js", "assets/pack.css", "assets/pack.js"]
  );
  assert.deepEqual(
    measurement.incrementalFiles?.map(({ file }) => file),
    ["assets/pack.css", "assets/pack.js"]
  );
  assert.deepEqual(measurement.activationAttributions, [{
    id: "pack",
    incremental: {
      script: gzipSync("pack").byteLength,
      style: gzipSync("style").byteLength,
      font: 0,
      asset: 0,
      total: gzipSync("pack").byteLength + gzipSync("style").byteLength
    },
    chunkKeys: ["pack.ts"],
    files: [{
      file: "assets/pack.css",
      kind: "style",
      gzipBytes: gzipSync("style").byteLength,
      ownerSources: ["pack.ts"]
    }, {
      file: "assets/pack.js",
      kind: "script",
      gzipBytes: gzipSync("pack").byteLength,
      ownerSources: ["pack.ts"]
    }]
  }]);
  assert.equal(
    "files" in summarizeKpBundleExperienceMeasurement(report).scenarios[1]!,
    false
  );
  assert.equal(
    "incrementalFiles" in
      summarizeKpBundleExperienceMeasurement(report).scenarios[1]!,
    false
  );
  assert.equal(
    "activationAttributions" in
      summarizeKpBundleExperienceMeasurement(report).scenarios[1]!,
    false
  );
});

test("targeted measurement includes transitive comparison bases", () => {
  const root = defineKpBundleExperienceScenario({
    id: "bundle-experience.synthetic.root",
    title: "Root",
    buildId: "bundle-build.main",
    entryRoots: ["root.ts"],
    activations: [],
    expectedOwners: [],
    forbiddenOwners: [],
    budgets: []
  });
  const middle = defineKpBundleExperienceScenario({
    id: "bundle-experience.synthetic.middle",
    title: "Middle",
    buildId: "bundle-build.main",
    entryRoots: ["root.ts"],
    activations: [{ id: "middle", manifestRoots: ["middle.ts"] }],
    comparisonBaseId: root.id,
    expectedOwners: [],
    forbiddenOwners: [],
    budgets: []
  });
  const leaf = defineKpBundleExperienceScenario({
    id: "bundle-experience.synthetic.leaf",
    title: "Leaf",
    buildId: "bundle-build.main",
    entryRoots: ["root.ts"],
    activations: [{ id: "leaf", manifestRoots: ["leaf.ts"] }],
    comparisonBaseId: middle.id,
    expectedOwners: [],
    forbiddenOwners: [],
    budgets: []
  });

  assert.deepEqual(
    includeKpBundleScenarioComparisonBases({
      selected: [leaf],
      registry: [root, middle, leaf]
    }).map(({ id }) => id),
    [root.id, middle.id, leaf.id]
  );
});
