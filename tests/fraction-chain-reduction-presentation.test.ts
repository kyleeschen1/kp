import test from "node:test";
import assert from "node:assert/strict";
import source from "../examples/algebra/fraction-chain.json" with { type: "json" };
import { compileFractionChain } from "../src/authoring/fraction-chain-compilation.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";
import { createKpFractionSelectorAnnotatedLatex } from "../src/rendering/generated-fraction-selector-annotated-latex.ts";

test("three-sixths reduction retains the existing three named operation presentations", () => {
  const result = compileFractionChain(source);
  assert.equal(result.status, "compiled"); if (result.status !== "compiled") return;
  const reduction = result.compilation.steps[2]!;
  if (reduction.kind !== "reduce") throw new Error("Missing reduction");
  const animation = reduction.animation;
  assert.deepEqual(animation.bundle.objects[0]!.value, { latex: "\\frac{3}{6}" });
  assert.deepEqual(animation.bundle.objects.at(-1)!.value, { latex: "\\frac{1}{2}" });
  for (const state of animation.bundle.objects) assert.ok(createKpFractionSelectorAnnotatedLatex({ objectId: state.id, selectors: state.selectors }));
  for (const progress of [1 / 6, .5, 5 / 6]) {
    const plan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, direction: "forward", progress }) });
    assert.deepEqual(plan.diagnostics, []);
    assert.equal(plan.transitions.length, 1);
    assert.equal(plan.transitions[0]!.semanticStatus, "ready");
  }
});
