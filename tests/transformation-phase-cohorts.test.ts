import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionEquationAnimationAsset
} from "../src/animation/foldable-distribution-equation-adapter.ts";
import {
  compileKpAnimationTransformationPhaseCohorts,
  findKpAnimationTransformationPhaseCohort
} from "../src/animation/transformation-phase-cohorts.ts";
import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";

test("phase cohorts retain singleton transition ids", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);

  assert.deepEqual(cohorts.map(({ id }) => id), [
    animation.transformations[0]!.id
  ]);
});

test("parallel same-endpoint operations compile as one ordered visual cohort", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const cohorts = compileKpAnimationTransformationPhaseCohorts(animation);

  assert.deepEqual(
    cohorts.map(({ transformationIds }) => transformationIds.length),
    [2, 2, 1, 1, 1]
  );
  assert.match(cohorts[0]!.id, /^cohort\./);
  assert.equal(
    findKpAnimationTransformationPhaseCohort({
      cohorts,
      transformationIds: cohorts[1]!.transformationIds
    }),
    cohorts[1]
  );
  assert.deepEqual(cohorts[0]!.sourceObjectIds, [
    "expression.foldable-distribution.factored"
  ]);
  assert.deepEqual(cohorts[0]!.targetObjectIds, [
    "expression.foldable-distribution.distributed-raw"
  ]);
});
