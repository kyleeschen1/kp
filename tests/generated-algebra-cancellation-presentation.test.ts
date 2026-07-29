import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  createGeneratedLinearSolveTutorialFixtures
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";
import {
  compileKpEquationCancellationPresentationPlan
} from "../src/animation/equation-cancellation-presentation.ts";
import {
  compileKpGeneratedAlgebraCancellationPresentationPlan
} from "../src/animation/generated-algebra-cancellation-presentation.ts";
import {
  createDistributionExpansionAnimationAsset
} from "../src/animation/distribution-adapter.ts";
import {
  isKpCompilerGeneratedAlgebraTransformation
} from "../src/semantic/generated-algebra-transformation-authority.ts";

const generatedCancellations = createGeneratedLinearSolveTutorialFixtures()
  .flatMap((fixture) => fixture.transformations)
  .filter(({ transformType }) =>
    transformType === "cancelAdditiveInverses" ||
    transformType === "cancelMultiplicativeInverses"
  );

test("every generated linear-solve cancellation owns one total role plan", () => {
  assert.equal(generatedCancellations.length, 7);

  for (const transformation of generatedCancellations) {
    const cancellationRecords = transformation.correspondenceMap?.records
      .filter(({ relation }) => relation === "cancelation") ?? [];
    assert.equal(cancellationRecords.length, 1);
    assert.equal(cancellationRecords[0]?.sourceSelectorIds.length, 2);

    const plan = compileKpEquationCancellationPresentationPlan(
      transformation
    );
    assert.equal(plan?.planKind, "inverse-cancellation");
    if (plan === undefined) continue;
    assert.equal(plan.inverseBundleIds.length, 2);

    const correspondenceIds = new Set(
      transformation.correspondenceMap!.records.flatMap((record) => [
        ...record.sourceSelectorIds,
        ...record.targetSelectorIds
      ])
    );
    const plannedIds = new Set(plan.roles.bundles.flatMap(
      ({ semanticEntityIds }) => semanticEntityIds
    ));
    assert.deepEqual(
      [...plannedIds].sort(),
      [...correspondenceIds].sort(),
      `${transformation.id} must classify every semantic selector exactly once.`
    );
  }
});

test("serialized or spread transformations cannot inherit compiler authority", () => {
  const transformation = generatedCancellations[0]!;
  const serialized = JSON.parse(
    JSON.stringify(transformation)
  ) as KpSemanticTransformation;
  const spread = { ...transformation };

  assert.equal(
    compileKpGeneratedAlgebraCancellationPresentationPlan(serialized),
    undefined
  );
  assert.equal(
    compileKpGeneratedAlgebraCancellationPresentationPlan(spread),
    undefined
  );
  assert.equal(
    compileKpEquationCancellationPresentationPlan(serialized),
    undefined
  );
});

test("trusted animation asset cloning preserves generated compiler authority", () => {
  const animation = createDistributionExpansionAnimationAsset();
  assert.ok(animation.transformations.every(
    isKpCompilerGeneratedAlgebraTransformation
  ));
});
