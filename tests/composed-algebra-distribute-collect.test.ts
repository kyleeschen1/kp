import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/distribute-collect.json" with { type: "json" };
import transfer from "../src/authoring/examples/distribute-collect-transfer.json" with { type: "json" };
import { prepareDistributeCollect, assertDistributeCollect } from "../src/authoring/distribute-collect-presentation.ts";
import { KpComposedAlgebraRepair } from "../src/authoring/composed-algebra-source.ts";
import { normalizeKpScalarSumProductEndpoint } from "../src/authoring/common-factor-normalizer.ts";
import { verifyKpDistributionBeforeCollection, projectKpDistributionBeforeCollection } from "../src/semantic/distribute-collect.ts";
import { distributeCollectEndpoints } from "../src/experiments/common-factor/endpoints.ts";
import { distributeCollectSequence } from "../src/experiments/composed-algebra/sequence.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("distribution and collection share actual endpoint identity for both mathematical sources", () => {
  for (const source of [primary, transfer]) {
    const draft = prepareDistributeCollect(source);
    assertDistributeCollect(draft);
    assert.deepEqual(draft.steps.map(s => s.plan.planKind), ["distribution", "factoring", "successor-synthesis"]);
    assert.equal(draft.animation.transformations.length, 3);
    for (let i = 0; i < 2; i++) assert.deepEqual(draft.steps[i]!.animation.bundle.objects[1], draft.steps[i + 1]!.animation.bundle.objects[0]);
    const endpoints = distributeCollectEndpoints(draft);
    assert.equal(endpoints.length, 4);
    assert.equal(endpoints[3]!.annotated.rawLatex, `${source.coefficient * 2}${source.symbol}`);
    assert.equal(distributeCollectSequence(draft).beats.length, 4);
    for (const direction of ["forward", "rewind"] as const) for (const progress of [0, .17, .5, .83, 1]) {
      const plan = projectKpReaderEquationRenderPlan({ animation: draft.animation,
        runtimeFrame: sampleKpAnimationRuntimeFrame({ animation: draft.animation, direction, progress }) });
      assert.deepEqual(plan.diagnostics, []);
    }
  }
});

test("distribution rejects a dropped copy, changed count or foreign variable before presentation", () => {
  const draft = prepareDistributeCollect(primary), collection = draft.checked.collection.chain.steps[0];
  for (const latex of ["3(x)", "4(x+x)", "3(x+y)", "3(x+x+x)"]) {
    const source = normalizeKpScalarSumProductEndpoint({ id: "state.wrong", latex }, ["x", "y"], "$.initial").structured;
    assert.throws(() => verifyKpDistributionBeforeCollection(source, collection));
  }
  assert.throws(() => projectKpDistributionBeforeCollection({ ...draft.checked.distribution }), TypeError);
});

test("bounded source refuses unsupported shapes and cannot supply motion or forged authority", () => {
  for (const value of [{ coefficient: -3, symbol: "x" }, { coefficient: 1.5, symbol: "x" },
    { coefficient: 10, symbol: "x" }, { coefficient: 3, symbol: "xy" }, { ...primary, duration: 10 }])
    assert.throws(() => prepareDistributeCollect(value), KpComposedAlgebraRepair);
  const draft = prepareDistributeCollect(primary);
  assert.throws(() => assertDistributeCollect({ ...draft }), TypeError);
  Object.assign(draft.animation.bundle.objects[0]!, { value: { latex: "wrong" } });
  assert.throws(() => assertDistributeCollect(draft), TypeError);
});
