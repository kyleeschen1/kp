import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionProjection, requireKpAuthoredDistributionNativeAnimation, KpAuthoredDistributionNativeGap } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { createKpFractionCompositionEquationAnimationAsset } from "../src/animation/fraction-composition-equation-adapter.ts";
import { validateKpAnimationAsset } from "../src/animation/asset.ts";

test("governed distribution projects exact canonical values without claiming runtime certification", () => {
  const result = createKpAuthoredDistributionProjection();
  const { animationCandidate: animation, governed, before, after } = result.projection;
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

test("multipart fraction fan-out fails closed at the registered native presentation boundary", () => {
  const result = createKpAuthoredDistributionProjection();
  assert.throws(() => requireKpAuthoredDistributionNativeAnimation(result.projection), error => {
    assert.ok(error instanceof KpAuthoredDistributionNativeGap);
    assert.equal(error.code, "kp.authoring.structural-native-presentation-gap");
    assert.equal(error.owner, "compiler-authority-review");
    assert.match(String(error.cause), /requires exactly one total fan-out ownership transfer/);
    return true;
  });
  // The supported canonical reference is not modified by the failed bridge.
  assert.equal(createKpFractionCompositionEquationAnimationAsset().transformations[0]!.definitionId, undefined);
});

test("copied and foreign applications cannot mint governed projection authority", () => {
  const first = createKpAuthoredDistributionProjection("projection.first");
  const second = createKpAuthoredDistributionProjection("projection.second");
  assert.throws(() => first.lower({ ...first.application }), /verified distribution application/);
  assert.throws(() => first.lower(second.application), /verified distribution application/);
});
