import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSuccessorSynthesisPlan,
  evaluateKpSuccessorInlineReadability,
  evaluateKpSuccessorSynthesisLaws,
  evaluateKpSuccessorTemporalContinuity,
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

test("the subtraction glyph collapses with the cohort without seeding material", () => {
  const plan = createConstantDifferenceSuccessorFixture();
  const frame = sampleKpSuccessorSynthesis({
    plan,
    progress: 0.42
  });
  const minus = frame.sources.find((source) => source.annotationId === "operator.minus")!;
  assert.equal(minus.contribution, "catalyst");
  assert.equal(minus.arrivalProgress, 0);
  assert.ok(minus.activationProgress > 0);
  assert.equal(minus.pose.scale, 0);
  assert.notEqual(minus.pose.x, 0);
  assert.ok(minus.pose.opacity > 0);
});

test("material inputs persist through recognition while catalysts retire with the consumed operation", () => {
  const plan = createConstantDifferenceSuccessorFixture();
  let observedOverlap = false;
  let observedCatalystRetirement = false;
  for (let index = 0; index <= 100; index += 1) {
    const frame = sampleKpSuccessorSynthesis({ plan, progress: index / 100 });
    if (!frame.targetRecognizable) {
      assert.ok(frame.sources
        .filter(({ contribution }) => contribution === "material-input")
        .every((source) => source.pose.opacity === 1));
      if (frame.sources.some((source) =>
        source.contribution === "catalyst" && source.pose.opacity < 1
      )) {
        observedCatalystRetirement = true;
      }
    }
    if (
      frame.targets.some((target) => target.pose.opacity > 0) &&
      frame.sources.some((source) => source.pose.opacity === 1)
    ) {
      observedOverlap = true;
    }
  }
  assert.equal(observedOverlap, true);
  assert.equal(observedCatalystRetirement, true);
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

test("separate result rows gather inside the measured material source band", () => {
  const plan = createKpSuccessorSynthesisPlan({
    id: "successor.stacked-addition",
    authority: {
      operationId: "kp.arithmetic.add",
      bindingId: "binding.stacked-addition"
    },
    sourceAnnotations: [
      {
        id: "upper",
        semanticRole: "addend",
        selectorIds: ["selector.upper"],
        contribution: "material-input",
        propagationRank: 0
      },
      {
        id: "lower",
        semanticRole: "addend",
        selectorIds: ["selector.lower"],
        contribution: "material-input",
        propagationRank: 1
      },
      {
        id: "plus",
        semanticRole: "addition-operator",
        selectorIds: ["selector.plus"],
        contribution: "catalyst",
        propagationRank: 0
      }
    ],
    targetAnnotations: [{
      id: "result",
      semanticRole: "sum",
      selectorIds: ["selector.result"],
      propagationRank: 0
    }],
    lineages: [{
      id: "lineage.stacked-addition",
      sourceAnnotationIds: ["upper", "lower"],
      targetAnnotationIds: ["result"]
    }],
    measurements: {
      upper: { left: 40, top: 0, width: 20, height: 40 },
      lower: { left: 40, top: 40, width: 20, height: 40.2 },
      plus: { left: 0, top: 40, width: 20, height: 40 },
      result: { left: 40, top: 80, width: 20, height: 40 }
    }
  });

  assert.deepEqual(plan.sourceJunction, { x: 50, y: 40.1 });
  assert.deepEqual(plan.junction, { x: 50, y: 100 });
  assert.equal(plan.junctionOwner, "target");
  assert.equal(plan.layoutTopologyAuthority, "measured-fallback");
});

test("source-owned fission does not manufacture a loop before transfer", () => {
  const plan = createKpSuccessorSynthesisPlan({
    id: "successor.source-owned-fission",
    authority: {
      operationId: "kp.core.fan-out",
      bindingId: "binding.source-owned-fission"
    },
    sourceAnnotations: [{
      id: "total",
      semanticRole: "evaluated-total",
      selectorIds: ["selector.total"],
      contribution: "material-input",
      propagationRank: 0
    }],
    targetAnnotations: [
      {
        id: "remainder",
        semanticRole: "remainder",
        selectorIds: ["selector.remainder"],
        propagationRank: 0
      },
      {
        id: "carry",
        semanticRole: "carry",
        selectorIds: ["selector.carry"],
        propagationRank: 1
      }
    ],
    lineages: [{
      id: "lineage.source-owned-fission",
      sourceAnnotationIds: ["total"],
      targetAnnotationIds: ["remainder", "carry"]
    }],
    measurements: {
      total: { left: 40, top: 80, width: 40, height: 20 },
      remainder: { left: 60, top: 80, width: 20, height: 20 },
      carry: { left: 40, top: 0, width: 20, height: 20 }
    },
    junctionOwner: "source"
  });
  const frame = sampleKpSuccessorSynthesis({ plan, progress: 0.5 });
  const source = frame.sources[0]!;

  assert.equal(plan.junctionOwner, "source");
  assert.deepEqual(plan.sourceJunction, { x: 60, y: 90 });
  assert.equal(source.pose.x, 0);
  assert.equal(source.pose.y, 0);
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
    .every((source) => source.pose.opacity > 0));
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

test("counter convergence preserves one readable inline source band", () => {
  const plan = createConstantDifferenceSuccessorFixture();
  const frames = Array.from({ length: 101 }, (_, index) =>
    sampleKpCounterConvergence({ plan, progress: index / 100 })
  );

  assert.deepEqual(evaluateKpSuccessorInlineReadability({
    plan,
    frames,
    maximumCenterDriftPx: 1
  }), []);
  assert.deepEqual(evaluateKpSuccessorTemporalContinuity({
    frames,
    maximumOpacityDelta: 0.16
  }), []);
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
