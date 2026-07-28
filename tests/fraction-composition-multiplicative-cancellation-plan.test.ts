import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpCancellationOperationPresentationPlan
} from "../src/animation/cancellation-operation-presentation-plan.ts";
import {
  createKpFractionCompositionCoefficientCancellationAuthoring,
  createKpFractionCompositionDenominatorCancellationAuthoring,
  kpFractionCompositionCoefficientCancellationTransformationId,
  kpFractionCompositionDenominatorCancellationTransformationId
} from "../src/animation/fraction-composition-cancellation-presentation.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import type {
  KpVerifiedOperationPresentationPlan
} from "../src/animation/operation-presentation-plan-types.ts";
import type {
  KpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";

function transformation(id: string): KpSemanticTransformation {
  const result = createKpFractionCompositionEquationAnimationAsset()
    .transformations.find((candidate) => candidate.id === id);
  if (result === undefined) {
    throw new Error(`Missing transformation fixture ${id}.`);
  }
  return result;
}

function assertTotalPlan(
  source: KpSemanticTransformation,
  plan: KpVerifiedOperationPresentationPlan
): void {
  const expectedSelectors = new Set(
    source.correspondenceMap?.records.flatMap((record) => [
      ...record.sourceSelectorIds,
      ...record.targetSelectorIds
    ])
  );
  const plannedSelectors = new Set(
    plan.roles.bundles.flatMap(({ semanticEntityIds }) => semanticEntityIds)
  );
  assert.deepEqual(plannedSelectors, expectedSelectors);
}

test("denominator cancellation separates inverse threes, operator catalyst, and rule artifact", () => {
  const source = transformation(
    kpFractionCompositionDenominatorCancellationTransformationId
  );
  const authoring =
    createKpFractionCompositionDenominatorCancellationAuthoring(source);
  const plan = compileKpCancellationOperationPresentationPlan(authoring);

  assert.deepEqual(
    authoring.inverseBundles.map(({ selectorIds }) => selectorIds),
    [
      ["balanced-multiplication.left.3"],
      ["balanced-multiplication.left.fraction.denominator"]
    ]
  );
  assert.deepEqual(authoring.catalysts.map(({ selectorIds }) => selectorIds), [
    ["balanced-multiplication.left.operator.1"]
  ]);
  assert.deepEqual(authoring.artifacts.map(({ selectorIds }) => selectorIds), [
    ["balanced-multiplication.left.fraction.fraction-rule"]
  ]);
  assertTotalPlan(source, plan);
});

test("coefficient cancellation keeps fraction rule out of inverse material", () => {
  const source = transformation(
    kpFractionCompositionCoefficientCancellationTransformationId
  );
  const authoring =
    createKpFractionCompositionCoefficientCancellationAuthoring(source);
  const plan = compileKpCancellationOperationPresentationPlan(authoring);

  assert.deepEqual(
    authoring.inverseBundles.map(({ selectorIds }) => selectorIds),
    [
      ["balanced-division.left.numerator.2"],
      ["balanced-division.left.denominator"]
    ]
  );
  assert.deepEqual(authoring.catalysts, []);
  assert.deepEqual(authoring.artifacts.map(({ selectorIds }) => selectorIds), [
    ["balanced-division.left.fraction-rule"]
  ]);
  assertTotalPlan(source, plan);
});

test("all canonical cancellation plans remain renderer-neutral", () => {
  const sources = [
    transformation(kpFractionCompositionDenominatorCancellationTransformationId),
    transformation(kpFractionCompositionCoefficientCancellationTransformationId)
  ];
  const plans = [
    compileKpCancellationOperationPresentationPlan(
      createKpFractionCompositionDenominatorCancellationAuthoring(sources[0]!)
    ),
    compileKpCancellationOperationPresentationPlan(
      createKpFractionCompositionCoefficientCancellationAuthoring(sources[1]!)
    )
  ];

  for (const plan of plans) {
    assert.equal(
      JSON.stringify(plan).match(/(?:DOM|pixel|rect|geometry|glyph)/gi),
      null
    );
  }
});
