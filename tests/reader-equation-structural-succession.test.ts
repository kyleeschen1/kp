import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/equation-render-plan.ts";

test("reader plan preserves compiler-owned structural succession intent", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.radical-structural-intent",
    animation,
    direction: "forward",
    progress: 0.5
  });
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  }).transitions[0]!;

  assert.equal(transition.visualMotif?.kind, "radical-corner-transfer");
  assert.deepEqual(transition.structuralSuccession, {
    kind: "equation-structural-succession-intent",
    id: `structural-succession.${transition.id}`,
    motifKind: "radical-corner-transfer",
    sourceEntityIds: [
      "expression.generated.radical.square-root-as-power.power.exponent-numerator",
      "expression.generated.radical.square-root-as-power.power.exponent-fraction-line",
      "expression.generated.radical.square-root-as-power.power.exponent-denominator"
    ],
    targetEntityIds: [
      "expression.generated.radical.square-root-as-power.radical.radical-overbar",
      "expression.generated.radical.square-root-as-power.radical.radical-hook"
    ],
    actPhaseIds: ["radical-representation-handoff"]
  });
});

test("ordinary correspondence receives motif intent without structural strategy", () => {
  const animation = createLinearSolveAnimationAsset();
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      id: "runtime.reader.linear-motif-intent",
      animation,
      direction: "forward",
      progress: 0.5
    })
  }).transitions[0]!;

  assert.notEqual(transition.visualMotif, undefined);
  assert.equal(transition.structuralSuccession, undefined);
});
