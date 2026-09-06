import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionProjection } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { createKpFractionCompositionEquationAnimationAsset } from "../src/animation/fraction-composition-equation-adapter.ts";
import { validateKpAnimationAsset } from "../src/animation/asset.ts";

test("governed distribution projects committed endpoints while preserving canonical paint inputs", () => {
  const result = createKpAuthoredDistributionProjection();
  const { animation, governed, before, after } = result.projection;
  const canonical = createKpFractionCompositionEquationAnimationAsset();
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.deepEqual(animation.bundle, canonical.bundle);
  assert.deepEqual(animation.timeline, canonical.timeline);
  assert.deepEqual(animation.transformationTree, canonical.transformationTree);
  assert.deepEqual(animation.renderTargets, canonical.renderTargets);
  assert.deepEqual(animation.metadata, canonical.metadata);
  assert.deepEqual(animation.transformations[0]!.correspondenceMap, canonical.transformations[0]!.correspondenceMap);
  assert.equal(animation.transformations[0]!.definitionId, "definition.generated.distribution.distribute-multiplication");
  assert.deepEqual(animation.transformations.slice(1), canonical.transformations.slice(1));
  assert.notEqual(before.versionId, after.versionId);
  assert.equal(governed.mathematicalVerification.operations.length, 1);
  assert.deepEqual(governed.mathematicalVerification.operations[0]!.sourceTruth.objectIds, ["fraction-solve.state.factored"]);
  assert.deepEqual(governed.mathematicalVerification.operations[0]!.targetTruth.objectIds, ["fraction-solve.state.distributed"]);
});

test("copied and foreign applications cannot mint governed projection authority", () => {
  const first = createKpAuthoredDistributionProjection("projection.first");
  const second = createKpAuthoredDistributionProjection("projection.second");
  assert.throws(() => first.lower({ ...first.application }), /verified distribution application/);
  assert.throws(() => first.lower(second.application), /verified distribution application/);
});
