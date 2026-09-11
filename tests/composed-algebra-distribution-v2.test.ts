import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraPrefixV2 } from "../src/authoring/composed-algebra-prefix-v2.ts";
import { checkKpComposedAlgebraDistributionV2 } from "../src/authoring/composed-algebra-distribution-v2.ts";
import { KpComposedAlgebraRepair } from "../src/authoring/composed-algebra-source.ts";
import { isKpVerifiedComposedDistribution, verifyKpComposedDistribution } from "../src/semantic/composed-algebra-distribution.ts";
import { projectKpComposedDistribution } from "../src/semantic/composed-algebra-distribution-projection.ts";
import { createVerifiedComposedDistributionAnimationAsset } from "../src/animation/distribution-adapter.ts";
import { projectKpContextualConstantSum } from "../src/semantic/contextual-constant-sum-projection.ts";
import { composeKpSemanticOperationProjections } from "../src/semantic/semantic-operation-projection.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";
import { normalizeKpScalarSumProductEndpoint } from "../src/authoring/common-factor-normalizer.ts";
import { sameKpStructuredExpressionTree } from "../src/semantic/structured-expression-rewrite.ts";

test("authored distribution retains issued adjacency and canonical fan-out with explicit product punctuation", () => {
  const prefix = checkKpComposedAlgebraPrefixV2(primary), proof = checkKpComposedAlgebraDistributionV2(prefix);
  assert.ok(isKpVerifiedComposedDistribution(proof));
  assert.equal(proof.source, prefix.prefix.chain.steps[1].target);
  assert.equal(proof.partition.evaluation, prefix.prefix.chain.steps[1]);
  assert.equal(proof.rewrite.lineage[0]!.targetSubtreeIds.length, 2);
  const projection = projectKpComposedDistribution(proof);
  const target = projection.endpoints[1].object.value as { latex: string };
  assert.match(target.latex, /5\\cdot|5 \\cdot/);
  assert.ok(sameKpStructuredExpressionTree(normalizeKpScalarSumProductEndpoint({ id: "paint", latex: target.latex }, ["x"], "paint").structured.root,
    proof.target.root));
  const records = projection.transformation.correspondenceMap!.records;
  assert.equal(records.filter(r => r.relation === "fan-out").length, 1);
  assert.equal(records.find(r => r.id === "product-punctuation-enters")!.targetSelectorIds.length, 1);
  const composed = composeKpSemanticOperationProjections("distribution-binding", [projectKpContextualConstantSum(proof.partition.evaluation), projection], [projection.handoff]);
  assert.equal(composed.transformations.length, 2);
  const animation = createVerifiedComposedDistributionAnimationAsset(proof);
  const plan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: .5, direction: "forward" }) });
  assert.deepEqual(plan.diagnostics, []);
  assert.equal(plan.transitions[0]!.semanticStatus, "ready");
  assert.equal(plan.transitions[0]!.presentationPlan.planKind, "distribution");
});

test("invalid distributed contributions return located repairs without forgiving commutation or early evaluation", () => {
  for (const latex of ["5x+3", "5x+4*3", "5*3+5x", "5x+15", "5x+5*4", "x*5+5*3"]) {
    const source = structuredClone(primary); source.states[3]!.latex = latex;
    assert.throws(() => checkKpComposedAlgebraDistributionV2(checkKpComposedAlgebraPrefixV2(source)), error =>
      error instanceof KpComposedAlgebraRepair && error.path === "$.states[3].latex");
  }
  const proof = checkKpComposedAlgebraDistributionV2(checkKpComposedAlgebraPrefixV2(primary));
  assert.equal(isKpVerifiedComposedDistribution({ ...proof }), false);
  assert.throws(() => verifyKpComposedDistribution({ partition: { ...proof.partition }, target: proof.target }), /issued/);
  assert.throws(() => createVerifiedComposedDistributionAnimationAsset({ ...proof }), /issued/);
});

test("canonical fixtures and authored distribution share lifecycle ownership", () => {
  for (const path of ["semantic/generated-algebra-tutorial-fixture.ts", "semantic/composed-algebra-distribution-projection.ts"])
    assert.match(readFileSync(new URL(`../src/${path}`, import.meta.url), "utf8"), /createKpDistributionCorrespondenceMap/);
});
