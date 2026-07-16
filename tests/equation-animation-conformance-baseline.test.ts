import assert from "node:assert/strict";
import test from "node:test";

import { createDistributionExpansionAnimationAsset } from "../src/animation/distribution-adapter.ts";
import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import { createKpAnimationAssetVisualMotifTimeline } from "../src/animation/visual-motif.ts";
import { defaultEquationTransformVisualMotifRules } from "../src/rendering/equation-visual-motif-defaults.ts";
import { compileKpSemanticEquationTransition } from "../src/rendering/semantic-equation-transition-compiler.ts";
import {
  equationAnimationConformanceBaseline,
  equationAnimationConformanceBaselines
} from "./fixtures/equation-animation-conformance-baseline.ts";

test("wrap and distribution baselines name every semantic checkpoint", () => {
  for (const baseline of equationAnimationConformanceBaselines) {
    assert.deepEqual(baseline.checkpoints, [
      { direction: "forward", progress: 0 },
      { direction: "forward", progress: 0.5 },
      { direction: "forward", progress: 1 },
      { direction: "rewind", progress: 0.5 }
    ]);
  }
});

test("function wrapping selects wrap semantics with executable choreography conformance", () => {
  const animation = createFunctionWrapAnimationAsset();
  const baseline = equationAnimationConformanceBaseline(animation.id);
  const transformation = animation.transformations[0]!;

  assert.equal(transformation.transformType, baseline.transformType);
  assert.equal(transformation.definitionId, baseline.definitionId);
  assert.deepEqual(
    transformation.correspondenceMap?.records.map((record) => [
      record.relation,
      record.sourceSelectorIds.length,
      record.targetSelectorIds.length
    ]),
    [
      ["role-change", 1, 1],
      ["introduction", 0, 3]
    ]
  );
  assert.equal(observedMotif(animation), baseline.observedMotif);
  assert.equal(baseline.requiredMotif, "wrap");
  assert.deepEqual(baseline.gaps, []);
});

test("distribution fan-out is semantically rich but geometrically collapsed", () => {
  const animation = createDistributionExpansionAnimationAsset();
  const baseline = equationAnimationConformanceBaseline(animation.id);
  const transformation = animation.transformations[0]!;
  const ir = compileKpSemanticEquationTransition({
    transformation,
    bundle: animation.bundle
  });
  const fanOut = ir.relations.find((relation) => relation.relation === "fan-out");

  assert.ok(fanOut);
  assert.equal(fanOut.sourceSelectorIds.length, 1);
  assert.equal(fanOut.targetSelectorIds.length, 2);
  assert.equal(transformation.transformType, baseline.transformType);
  assert.equal(transformation.definitionId, baseline.definitionId);
  assert.equal(observedMotif(animation), baseline.observedMotif);
  assert.equal(baseline.observedMotif, "artifact-replace");
  assert.equal(baseline.requiredMotif, "copy-fan-out");
  assert.deepEqual(baseline.gaps, [
    "fan-out semantics select generic artifact replacement",
    "two destinations share one union-bounds delta",
    "copies remain invisible at the semantic midpoint",
    "copy transit has no independently inspectable paths"
  ]);
});

function observedMotif(
  animation: ReturnType<typeof createFunctionWrapAnimationAsset>
): string {
  return createKpAnimationAssetVisualMotifTimeline({
    id: `${animation.id}.conformance-baseline`,
    animation,
    rules: defaultEquationTransformVisualMotifRules
  }).segments[0]!.motifKind;
}
