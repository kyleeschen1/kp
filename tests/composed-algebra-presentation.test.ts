import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import product from "../src/authoring/examples/composed-algebra-product.json" with { type: "json" };
import { checkKpComposedAlgebraProof } from "../src/authoring/composed-algebra-proof.ts";
import { resolveKpComposedAlgebraPresentation, assertKpComposedAlgebraPresentation } from "../src/authoring/composed-algebra-presentation.ts";
import { createDistributionFactoringAnimationAsset } from "../src/animation/distribution-adapter.ts";
import { createKpOnePlusTwoEvaluationAnimationAsset } from "../src/animation/operation-evaluation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";
import { findKpRegisteredOperationPresentationPlan } from "../src/animation/operation-presentation-plan-types.ts";
import { isKpVerifiedEquationEvaluationFamilyCertificateV2 } from "../src/domain-ir/equation-evaluation-family-certificate-v2.ts";
import { parseLatexScalarExpression, LatexParseError } from "../src/math/latex-parser.ts";

test("composed presentation binds complete canonical factoring and evaluation rather than raw candidates", () => {
  const checked = checkKpComposedAlgebraProof(primary), binding = resolveKpComposedAlgebraPresentation(checked);
  assertKpComposedAlgebraPresentation(binding);
  const [factor, evaluation] = binding.steps;
  assert.equal(binding.revisionId, checked.revisionId);
  assert.equal(factor.plan.planKind, "factoring");
  assert.ok(factor.plan.factoringMotifBinding.operationPresentationPlan.choreography);
  assert.equal(findKpRegisteredOperationPresentationPlan(factor.animation.transformations[0]!), factor.plan.factoringMotifBinding.operationPresentationPlan);
  assert.equal(factor.animation.timeline!.durationMs, createDistributionFactoringAnimationAsset().timeline!.durationMs);
  const canonical = createKpOnePlusTwoEvaluationAnimationAsset();
  const canonicalPlan = projectKpReaderEquationRenderPlan({ animation: canonical,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation: canonical, direction: "forward", progress: .5 }) }).transitions[0]!.presentationPlan;
  assert.equal(canonicalPlan.planKind, "successor-synthesis");
  if (canonicalPlan.planKind !== "successor-synthesis") throw Error("canonical fixture");
  assert.equal(evaluation.plan.executableProgram, canonicalPlan.executableProgram);
  assert.equal(evaluation.animation.timeline!.durationMs, canonical.timeline!.durationMs);
  assert.deepEqual(factor.animation.bundle.objects[1], evaluation.animation.bundle.objects[0]);
  assert.equal(evaluation.plan.successorSyntheses[0].paintContinuityPlan.endpointSettlement, "native-source-and-target");
  assert.deepEqual(factor.evaluationCertificates, []);
  assert.equal(evaluation.evaluationCertificates.length, 1);
  assert.ok(isKpVerifiedEquationEvaluationFamilyCertificateV2(evaluation.evaluationCertificates[0]));
  assert.equal(evaluation.evaluationCertificates[0].transformationId, evaluation.animation.transformations[0]!.id);
  assert.equal(evaluation.evaluationCertificates[0].familyProfile.family, "contributor-fusion");
});

test("source-only, forged, serialized or mutated objects cannot mount as composed presentations", () => {
  const checked = checkKpComposedAlgebraProof(primary), binding = resolveKpComposedAlgebraPresentation(checked);
  for (const value of [primary, checked, checked.chain, { ...binding }, JSON.parse(JSON.stringify(binding))])
    assert.throws(() => assertKpComposedAlgebraPresentation(value), TypeError);
  assert.throws(() => resolveKpComposedAlgebraPresentation({ ...checked }), TypeError);
  Object.assign(binding.steps[0].animation.bundle.objects[0]!, { value: { latex: "wrong" } });
  assert.throws(() => assertKpComposedAlgebraPresentation(binding), TypeError);
});

test("source-only product caller reuses canonical owners in the opposite orientation", () => {
  const original = resolveKpComposedAlgebraPresentation(checkKpComposedAlgebraProof(primary));
  const checked = checkKpComposedAlgebraProof(product);
  const binding = resolveKpComposedAlgebraPresentation(checked);
  assert.equal(checked.chain.steps[0].orientation, "left");
  assert.equal(checked.chain.steps[0].factor.kind, "product");
  assert.equal(binding.owner, original.owner);
  assert.deepEqual(binding.checkpointProgress, original.checkpointProgress);
  assert.deepEqual(binding.steps.map(step => step.canonicalReference), original.steps.map(step => step.canonicalReference));
  assert.equal(binding.steps[1].plan.executableProgram, original.steps[1].plan.executableProgram);
  assert.equal(binding.revisionId, checked.revisionId);
});

test("scalar notation round-trips numeric multipliers after closed groups without accepting ambiguous adjacency", () => {
  for (const group of ["(x+y)", "{x*y}", "((x+y)*y)"])
    assert.deepEqual(parseLatexScalarExpression(`${group}12`, ["x", "y"]), parseLatexScalarExpression(`${group}*12`, ["x", "y"]));
  for (const ambiguous of ["x2", "1 2", "(x+y)2 3"])
    assert.throws(() => parseLatexScalarExpression(ambiguous, ["x", "y"]), LatexParseError);
});
