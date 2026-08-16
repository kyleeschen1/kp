import assert from "node:assert/strict";
import test from "node:test";

import {
  findKpBundleBuildDeclaration,
  findKpBundleExperienceScenario,
  kpBundleBuildDeclarations,
  kpBundleExperienceScenarios
} from "./kp-bundle-experience-scenarios.ts";

test("representative bundle scenarios cover each approved experience family", () => {
  assert.deepEqual(
    kpBundleExperienceScenarios.map(({ id }) => id),
    [
      "bundle-experience.catalogue.outer-shell",
      "bundle-experience.catalogue.empty",
      "bundle-experience.catalogue.solve-x",
      "bundle-experience.catalogue.economics",
      "bundle-experience.catalogue.programming-trace",
      "bundle-experience.catalogue.graph-3d",
      "bundle-experience.catalogue.place-value",
      "bundle-experience.studio.legacy-host",
      "bundle-experience.public.typescript-free-shipping",
      "bundle-experience.public.fraction-composition",
      "bundle-experience.public.normal-matrices",
      "bundle-experience.public.eigenvectors"
    ]
  );
});

test("scenario and build registries are immutable data-only declarations", () => {
  assert.ok(Object.isFrozen(kpBundleExperienceScenarios));
  assert.ok(Object.isFrozen(kpBundleBuildDeclarations));
  assert.doesNotThrow(() => JSON.stringify(kpBundleExperienceScenarios));
  for (const scenario of kpBundleExperienceScenarios) {
    assert.ok(Object.isFrozen(scenario));
    assert.equal(
      findKpBundleBuildDeclaration(scenario.buildId).id,
      scenario.buildId
    );
  }
});

test("selected experiences preserve explicit comparable catalogue bases", () => {
  const selected = kpBundleExperienceScenarios.filter(({ id }) =>
    id.startsWith("bundle-experience.catalogue.") &&
    !id.endsWith("outer-shell") &&
    !id.endsWith("empty")
  );
  assert.ok(selected.length >= 5);
  const placeValue = findKpBundleExperienceScenario(
    "bundle-experience.catalogue.place-value"
  );
  assert.ok(selected.filter(({ id }) => id !== placeValue.id)
    .every(({ comparisonBaseId }) =>
      comparisonBaseId === "bundle-experience.catalogue.empty"
    ));
  // Place value preserves the old selected-math differential explicitly.
  assert.equal(
    placeValue.comparisonBaseId,
    "bundle-experience.catalogue.solve-x"
  );
  assert.equal(placeValue.budgets[0]?.gzipBytes, 75_000);
});

test("non-equation catalogue experiences exclude the native KaTeX pack", () => {
  const packOwner =
    "src/rendering/native-katex-feature-pack-implementation.ts";
  for (const id of [
    "bundle-experience.catalogue.empty",
    "bundle-experience.catalogue.economics",
    "bundle-experience.catalogue.programming-trace",
    "bundle-experience.catalogue.graph-3d"
  ] as const) {
    assert.ok(
      findKpBundleExperienceScenario(id).forbiddenOwners.includes(packOwner),
      `${id} must not acquire the native KaTeX feature pack.`
    );
  }
});
