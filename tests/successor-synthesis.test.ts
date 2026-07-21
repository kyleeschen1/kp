import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSuccessorSynthesisPlan,
  evaluateKpSuccessorSynthesisLaws,
  sampleKpCounterConvergence,
  sampleKpSuccessorSynthesis
} from "../src/animation/successor-synthesis.ts";
import { createConstantDifferenceSuccessorFixture } from "./fixtures/successor-synthesis-fixture.ts";

test("successor synthesis separates material inputs from causal catalysts", () => {
  const plan = createConstantDifferenceSuccessorFixture();
  assert.deepEqual(plan.materialInputs.map((member) => member.id), [
    "operand.seven",
    "operand.four"
  ]);
  assert.deepEqual(plan.catalysts.map((member) => member.id), ["operator.minus"]);
  assert.deepEqual(plan.targets.map((member) => member.id), ["result.three"]);
  assert.equal(plan.authority.operationId, "kp.algebra.simplify-constant-difference");
  assert.deepEqual(plan.materialInputs.map((member) => member.pathFamily), [
    "arc-above",
    "arc-below"
  ]);
});

test("target birth waits until every required input reaches the junction", () => {
  const plan = createConstantDifferenceSuccessorFixture();
  const early = sampleKpSuccessorSynthesis({ plan, progress: 0.58 });
  assert.equal(early.allRequiredInputsReady, false);
  assert.ok(early.targets.every((target) => target.birthProgress === 0));

  const ready = sampleKpSuccessorSynthesis({ plan, progress: 0.7 });
  assert.equal(ready.allRequiredInputsReady, true);
  assert.ok(ready.targets.every((target) => target.birthProgress > 0));
});

test("semantic rank staggers convergence without shrinking inputs to zero", () => {
  const frame = sampleKpSuccessorSynthesis({
    plan: createConstantDifferenceSuccessorFixture(),
    progress: 0.42
  });
  const seven = frame.sources.find((source) => source.annotationId === "operand.seven")!;
  const four = frame.sources.find((source) => source.annotationId === "operand.four")!;
  assert.ok(seven.arrivalProgress > four.arrivalProgress);
  assert.ok(seven.pose.scale >= 0.68);
  assert.ok(four.pose.scale >= 0.68);
});

test("the subtraction glyph activates but contributes no result material", () => {
  const frame = sampleKpSuccessorSynthesis({
    plan: createConstantDifferenceSuccessorFixture(),
    progress: 0.26
  });
  const minus = frame.sources.find((source) => source.annotationId === "operator.minus")!;
  assert.equal(minus.contribution, "catalyst");
  assert.equal(minus.arrivalProgress, 0);
  assert.ok(minus.activationProgress > 0);
  assert.ok(minus.pose.scale > 1);
});

test("sources persist through target recognition and overlap its birth", () => {
  const plan = createConstantDifferenceSuccessorFixture();
  let observedOverlap = false;
  for (let index = 0; index <= 100; index += 1) {
    const frame = sampleKpSuccessorSynthesis({ plan, progress: index / 100 });
    if (!frame.targetRecognizable) {
      assert.ok(frame.sources.every((source) => source.pose.opacity === 1));
    }
    if (
      frame.targets.some((target) => target.pose.opacity > 0) &&
      frame.sources.some((source) => source.pose.opacity === 1)
    ) {
      observedOverlap = true;
    }
  }
  assert.equal(observedOverlap, true);
});

test("successor synthesis settles at exact native target geometry", () => {
  const settled = sampleKpSuccessorSynthesis({
    plan: createConstantDifferenceSuccessorFixture(),
    progress: 1
  });
  assert.equal(settled.phase, "settled");
  assert.ok(settled.sources.every((source) => source.pose.opacity === 0));
  assert.ok(settled.targets.every((target) =>
    target.pose.opacity === 1 &&
    target.pose.x === 0 &&
    target.pose.y === 0 &&
    target.pose.scale === 1
  ));
});

test("constant-difference fixture satisfies successor synthesis laws", () => {
  assert.deepEqual(
    evaluateKpSuccessorSynthesisLaws(createConstantDifferenceSuccessorFixture()),
    []
  );
});

test("successor synthesis rejects catalyst lineage and missing authority", () => {
  assert.throws(() => invalidPlan({ operationId: "" }), /authority.operationId/);
  assert.throws(() => invalidPlan({ catalystInLineage: true }), /cannot contribute result material/);
});

test("counter convergence retires its catalyst before seeding the result", () => {
  const plan = createConstantDifferenceSuccessorFixture();
  const approaching = sampleKpCounterConvergence({ plan, progress: 0.55 });
  assert.deepEqual(
    approaching.sources
      .filter((source) => source.contribution === "material-input")
      .map((source) => source.pathFamily),
    ["arc-above", "arc-below"]
  );
  assert.ok(approaching.targets.every((target) => target.pose.opacity === 0));

  const retiring = sampleKpCounterConvergence({ plan, progress: 0.72 });
  const catalyst = retiring.sources.find((source) =>
    source.contribution === "catalyst"
  )!;
  const materials = retiring.sources.filter((source) =>
    source.contribution === "material-input"
  );
  assert.equal(catalyst.pose.opacity, 0);
  assert.ok(materials.every((source) => source.pose.opacity > 0));
  assert.ok(retiring.targets.every((target) => target.pose.opacity === 0));

  const handoff = sampleKpCounterConvergence({ plan, progress: 0.79 });
  assert.ok(handoff.sources.filter((source) => source.contribution === "material-input")
    .every((source) => source.pose.opacity < 0.05));
  assert.ok(handoff.targets.every((target) => target.pose.opacity > 0));

  const settled = sampleKpCounterConvergence({ plan, progress: 1 });
  assert.ok(settled.sources.every((source) => source.pose.opacity === 0));
  assert.ok(settled.targets.every((target) =>
    target.pose.opacity === 1 &&
    target.pose.x === 0 &&
    target.pose.y === 0 &&
    target.pose.scale === 1
  ));
});

function invalidPlan(options: {
  readonly operationId?: string;
  readonly catalystInLineage?: boolean;
}) {
  return createKpSuccessorSynthesisPlan({
    id: "successor.invalid",
    authority: {
      operationId: options.operationId ?? "kp.algebra.add",
      bindingId: "binding.invalid"
    },
    sourceAnnotations: [
      {
        id: "input",
        semanticRole: "input",
        selectorIds: ["selector.input"],
        contribution: "material-input",
        propagationRank: 0
      },
      {
        id: "operator",
        semanticRole: "operator",
        selectorIds: ["selector.operator"],
        contribution: "catalyst",
        propagationRank: 0
      }
    ],
    targetAnnotations: [{
      id: "target",
      semanticRole: "result",
      selectorIds: ["selector.target"],
      propagationRank: 0
    }],
    lineages: [{
      id: "lineage.invalid",
      sourceAnnotationIds: options.catalystInLineage ? ["input", "operator"] : ["input"],
      targetAnnotationIds: ["target"]
    }],
    measurements: {
      input: { left: 0, top: 0, width: 10, height: 10 },
      operator: { left: 12, top: 0, width: 8, height: 4 },
      target: { left: 24, top: 0, width: 10, height: 10 }
    }
  });
}
