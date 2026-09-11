import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraPrefixV2 } from "../src/authoring/composed-algebra-prefix-v2.ts";
import { checkKpComposedAlgebraProductV2 } from "../src/authoring/composed-algebra-product-v2.ts";
import { KpComposedAlgebraRepair } from "../src/authoring/composed-algebra-source.ts";
import { isKpVerifiedComposedProductEvaluation, verifyKpComposedProductEvaluation } from "../src/semantic/composed-algebra-product-evaluation.ts";
import { projectKpContextualConstantProduct } from "../src/semantic/contextual-constant-product-projection.ts";
import { projectKpComposedDistribution } from "../src/semantic/composed-algebra-distribution-projection.ts";
import { composeKpSemanticOperationProjections } from "../src/semantic/semantic-operation-projection.ts";
import { createVerifiedContextualConstantProductAnimationAsset } from "../src/animation/operation-evaluation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";

test("exact contextual multiplication uses the canonical ink-glyph evaluation with unchanged context", () => {
  const proof = checkKpComposedAlgebraProductV2(checkKpComposedAlgebraPrefixV2(primary));
  assert.ok(isKpVerifiedComposedProductEvaluation(proof));
  assert.equal(proof.source, proof.distribution.target);
  assert.equal(proof.result.value, 15);
  const projection = projectKpContextualConstantProduct(proof);
  assert.equal((projection.endpoints[1].object.value as { latex: string }).latex, "5x + 15");
  assert.equal(composeKpSemanticOperationProjections("product-test", [projectKpComposedDistribution(proof.distribution), projection]).transformations.length, 2);
  const records = projection.transformation.correspondenceMap!.records;
  assert.equal(records.filter(r => r.relation === "fan-in").length, 1);
  assert.equal(records.filter(r => r.relation === "identity").length, 3);
  const animation = createVerifiedContextualConstantProductAnimationAsset(proof);
  const plan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: .5, direction: "forward" }) });
  assert.deepEqual(plan.diagnostics, []);
  assert.equal(plan.transitions[0]!.semanticStatus, "ready");
  assert.equal(plan.transitions[0]!.presentationPlan.planKind, "successor-synthesis");
});

test("product evaluation rejects changed context, arithmetic errors, commutation and forged authority", () => {
  for (const latex of ["5x+16", "6x+15", "15+5x", "x*5+15", "5x+5*3"]) {
    const source = structuredClone(primary); source.states[4]!.latex = latex;
    assert.throws(() => checkKpComposedAlgebraProductV2(checkKpComposedAlgebraPrefixV2(source)), error =>
      error instanceof KpComposedAlgebraRepair && error.path === "$.states[4].latex");
  }
  const proof = checkKpComposedAlgebraProductV2(checkKpComposedAlgebraPrefixV2(primary));
  assert.equal(isKpVerifiedComposedProductEvaluation({ ...proof }), false);
  assert.throws(() => verifyKpComposedProductEvaluation({ distribution: { ...proof.distribution }, target: proof.target }), /issued/);
  assert.throws(() => createVerifiedContextualConstantProductAnimationAsset({ ...proof }), /issued/);
  assert.ok(Object.isFrozen(proof.localEvaluation.bundle.objects[0]!.selectors));
});

test("the product must fit exact safe integer arithmetic before the animation asset is built", () => {
  const source = structuredClone(primary);
  source.states.forEach((state, index) => { state.latex = ["2(x+3000000000000000)+3(x+3000000000000000)",
    "(2+3)(x+3000000000000000)", "5(x+3000000000000000)", "5x+5*3000000000000000", "5x+15"][index]!; });
  assert.throws(() => checkKpComposedAlgebraProductV2(checkKpComposedAlgebraPrefixV2(source)), /safe integer/);
});
