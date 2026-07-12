import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpBehavior
} from "../src/semantic/asset-behavior.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf
} from "../src/semantic/asset-diagram.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  checkKpBehaviorDeterminism,
  checkKpBehaviorReparameterization,
  checkKpDiagramRewindLaw,
  checkKpEquationFrameSelectorCorrespondenceClosure
} from "../src/semantic/asset-laws.ts";
import type { KpEquationFrame } from "../src/semantic/equation-frame-interpreter.ts";

test("checkKpBehaviorDeterminism passes repeated equivalent samples", () => {
  const behavior = createKpBehavior({
    id: "behavior.deterministic",
    durationMs: 1000,
    sample: ({ progress }) => ({
      phase: progress < 0.5 ? "first" : "second",
      progress
    })
  });

  assert.deepEqual(checkKpBehaviorDeterminism(behavior, [0, 250, 750]), {
    lawId: "behavior.determinism",
    passed: true,
    failures: []
  });
});

test("checkKpBehaviorDeterminism reports changing samples", () => {
  let count = 0;
  const behavior = createKpBehavior({
    id: "behavior.nondeterministic",
    durationMs: 1000,
    sample: () => ({
      count: count++
    })
  });

  assert.deepEqual(checkKpBehaviorDeterminism(behavior, [250]), {
    lawId: "behavior.determinism",
    passed: false,
    failures: [
      {
        path: "samples[0]",
        message:
          "Behavior behavior.nondeterministic produced different frames for time 250."
      }
    ]
  });
});

test("checkKpDiagramRewindLaw validates exact reverse phase ordering", () => {
  const first = createKpSemanticTransformation({
    id: "transform.first",
    transformType: "subtractBothSides",
    title: "First",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.with-inverses"],
    preserves: ["value"]
  });
  const second = createKpSemanticTransformation({
    id: "transform.second",
    transformType: "cancel",
    title: "Second",
    sourceObjectIds: ["equation.with-inverses"],
    targetObjectIds: ["equation.done"],
    preserves: ["value"]
  });
  const diagram = createKpSemanticDiagramSequence({
    id: "diagram.linear-solve",
    title: "Linear solve",
    children: [
      createKpTransformationDiagramLeaf(first),
      createKpTransformationDiagramLeaf(second)
    ]
  });

  assert.deepEqual(checkKpDiagramRewindLaw(diagram), {
    lawId: "diagram.rewind",
    passed: true,
    failures: []
  });
});

test("checkKpBehaviorReparameterization validates normalized samples", () => {
  const behavior = createKpBehavior({
    id: "behavior.original",
    durationMs: 1000,
    sample: ({ progress }) => ({
      phase: progress < 0.5 ? "move" : "settle"
    })
  });

  assert.deepEqual(checkKpBehaviorReparameterization(behavior, 3000, [0, 0.25, 1]), {
    lawId: "behavior.reparameterization",
    passed: true,
    failures: []
  });
});

test("checkKpEquationFrameSelectorCorrespondenceClosure validates frame-local selector pairs", () => {
  const frame = equationFrame({
    selectorIds: ["equation.initial.x", "equation.next.x"],
    correspondence: [
      {
        sourceSelectorId: "equation.initial.x",
        targetSelectorId: "equation.next.x",
        preserves: ["identity"]
      }
    ]
  });

  assert.deepEqual(checkKpEquationFrameSelectorCorrespondenceClosure(frame), {
    lawId: "equation-frame.selector-correspondence-closure",
    passed: true,
    failures: []
  });
});

test("checkKpEquationFrameSelectorCorrespondenceClosure reports missing frame selectors", () => {
  const frame = equationFrame({
    selectorIds: ["equation.initial.x"],
    correspondence: [
      {
        sourceSelectorId: "equation.initial.x",
        targetSelectorId: "equation.next.x",
        preserves: ["identity"]
      }
    ]
  });

  assert.deepEqual(checkKpEquationFrameSelectorCorrespondenceClosure(frame), {
    lawId: "equation-frame.selector-correspondence-closure",
    passed: false,
    failures: [
      {
        path: "selectorCorrespondenceRefs[0].targetSelectorId",
        message:
          "Equation frame frame.sample correspondence references missing target selector equation.next.x."
      }
    ]
  });
});

function equationFrame(input: {
  readonly selectorIds: readonly string[];
  readonly correspondence: KpEquationFrame["selectorCorrespondenceRefs"];
}): KpEquationFrame {
  return {
    id: "frame.sample",
    assetId: "asset.sample",
    progress: 0.5,
    surface: "katex-dom",
    activeTransformationIds: ["transform.sample"],
    objectRefs: [],
    transformationRefs: [],
    selectorRefs: input.selectorIds.map((selectorId) => ({
      selectorId,
      objectId: selectorId.split(".").slice(0, 2).join("."),
      role: "persistent"
    })),
    selectorCorrespondenceRefs: input.correspondence,
    diagnostics: []
  };
}
