import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpBundleExperienceScenario
} from "./bundle-experience-scenario.ts";

const validScenario = () => defineKpBundleExperienceScenario({
  id: "bundle-experience.catalogue.place-value",
  title: "Catalogue with place-value selected",
  buildId: "bundle-build.main",
  entryRoots: ["src/editor/svelte-catalogue/catalogue-entry.ts"],
  activations: [{
    id: "select-place-value",
    manifestRoots: ["src/animation/catalog-packs/place-value.ts"]
  }],
  comparisonBaseId: "bundle-experience.catalogue.empty",
  expectedOwners: ["src/animation/catalog-packs/place-value.ts"],
  forbiddenOwners: ["src/rendering/graph-webgl-three.ts"],
  budgets: [{
    phase: "incremental",
    resource: "total",
    gzipBytes: 75_000
  }]
});

test("bundle experience scenarios are immutable serializable declarations", () => {
  const scenario = validScenario();

  assert.equal(scenario.schemaVersion, "kp.bundle-experience-scenario.v1");
  assert.ok(Object.isFrozen(scenario));
  assert.ok(Object.isFrozen(scenario.entryRoots));
  assert.ok(Object.isFrozen(scenario.activations));
  assert.ok(Object.isFrozen(scenario.activations[0]));
  assert.ok(Object.isFrozen(scenario.activations[0]!.manifestRoots));
  assert.ok(Object.isFrozen(scenario.budgets[0]));
  assert.doesNotThrow(() => JSON.stringify(scenario));
});

test("bundle scenarios require one unique entry and unique activation roots", () => {
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    entryRoots: []
  }), /requires an entry root/);
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    entryRoots: ["entry.ts", "entry.ts"]
  }), /entry roots repeats entry\.ts/);
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    entryRoots: ["entry.ts"],
    activations: [{ id: "activate", manifestRoots: ["entry.ts"] }]
  }), /reaches root entry\.ts more than once/);
});

test("bundle scenarios reject ambiguous activation and owner declarations", () => {
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    activations: [
      { id: "same", manifestRoots: ["one.ts"] },
      { id: "same", manifestRoots: ["two.ts"] }
    ]
  }), /repeats activation same/);
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    expectedOwners: ["shared.ts"],
    forbiddenOwners: ["shared.ts"]
  }), /both expects and forbids owner shared\.ts/);
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    comparisonBaseId: "bundle-experience.catalogue.place-value"
  }), /cannot compare with itself/);
});

test("incremental budgets require a base and every budget key is singular", () => {
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    comparisonBaseId: undefined
  }), /needs a comparison base/);
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    budgets: [
      { phase: "experience", resource: "script", gzipBytes: 10 },
      { phase: "experience", resource: "script", gzipBytes: 20 }
    ]
  }), /repeats budget experience:script/);
  assert.throws(() => defineKpBundleExperienceScenario({
    ...validScenario(),
    budgets: [{ phase: "experience", resource: "total", gzipBytes: 0 }]
  }), /invalid gzip budget 0/);
});
