import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpCancellationOperationPresentationPlan
} from "../src/animation/cancellation-operation-presentation-plan.ts";
import {
  createKpFractionCompositionAdditiveCancellationAuthoring,
  kpFractionCompositionAdditiveCancellationTransformationId
} from "../src/animation/fraction-composition-cancellation-presentation.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";

function additiveFixture() {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ id }) =>
      id === kpFractionCompositionAdditiveCancellationTransformationId
  )!;
  const authoring =
    createKpFractionCompositionAdditiveCancellationAuthoring(transformation);
  const plan = compileKpCancellationOperationPresentationPlan(authoring);
  assert.equal(plan.planKind, "inverse-cancellation");
  if (plan.planKind !== "inverse-cancellation") {
    throw new Error("Expected inverse-cancellation plan.");
  }
  return { transformation, authoring, plan };
}

test("additive cancellation authors positive and negative four term bundles", () => {
  const { authoring, plan } = additiveFixture();

  assert.deepEqual(
    authoring.inverseBundles.map(({ selectorIds }) => selectorIds),
    [
      [
        "balanced-subtraction.left.source.operator.1",
        "balanced-subtraction.left.4"
      ],
      [
        "balanced-subtraction.left.minus4.minus",
        "balanced-subtraction.left.minus4.value"
      ]
    ]
  );
  assert.deepEqual(authoring.catalysts, []);
  assert.deepEqual(authoring.artifacts, []);
  assert.deepEqual(
    plan.roles.groups[0]?.bundleIds,
    plan.inverseBundleIds
  );
  assert.ok(plan.roles.bundles.some(({ role }) => role === "continuant"));
});

test("additive cancellation plan is total and renderer-neutral", () => {
  const { transformation, plan } = additiveFixture();
  const expectedSelectors = new Set(
    transformation.correspondenceMap?.records.flatMap((record) => [
      ...record.sourceSelectorIds,
      ...record.targetSelectorIds
    ])
  );
  const plannedSelectors = new Set(
    plan.roles.bundles.flatMap(({ semanticEntityIds }) => semanticEntityIds)
  );

  assert.deepEqual(plannedSelectors, expectedSelectors);
  assert.equal(
    JSON.stringify(plan).match(/(?:DOM|pixel|rect|geometry|glyph)/gi),
    null
  );
});

test("additive authoring fails if semantic correspondence drifts", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ id }) =>
      id === kpFractionCompositionAdditiveCancellationTransformationId
  )!;
  const records = transformation.correspondenceMap!.records.map((record) =>
    record.id === "left-fours-cancel"
      ? {
          ...record,
          sourceSelectorIds: record.sourceSelectorIds.slice(1)
        }
      : record
  );

  assert.throws(
    () => createKpFractionCompositionAdditiveCancellationAuthoring({
      ...transformation,
      correspondenceMap: {
        ...transformation.correspondenceMap!,
        records
      }
    }),
    /foreign to the transition|outside the canonical cancellation record/
  );
});
