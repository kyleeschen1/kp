import assert from "node:assert/strict";
import test from "node:test";

import { createNumeratorSplitEquationAnimationAsset } from "../src/animation/numerator-split-merge-equation-adapter.ts";
import { createKpLinearRearrangementChoreography } from "../src/animation/linear-rearrangement-choreography.ts";
import { createKpEquationLinearRearrangementBindings } from "../src/rendering/equation-linear-rearrangement-bindings.ts";
import type {
  KpMeasuredEquationTransitionEndpoint,
  KpMeasuredEquationTransitionGeometry
} from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";
import { createKpNumeratorSplitMergeSelectorAnnotatedLatex } from "../src/rendering/numerator-split-merge-selector-annotated-latex.ts";
import { createNumeratorSplitMergeEquationKpAsset } from "../src/semantic/numerator-split-merge-equation-asset.ts";

test("numerator split binds a first-class structural rearrangement", () => {
  const animation = createNumeratorSplitEquationAnimationAsset();
  assert.deepEqual(
    createKpEquationLinearRearrangementBindings(animation).map((binding) => [
      binding.transformationId,
      binding.kind
    ]),
    [["transform.numerator-split-merge.split-sum", "split-fraction-sum"]]
  );
  const choreography = createKpLinearRearrangementChoreography(animation);
  assert.deepEqual(choreography.steps.map((step) => step.kind), ["split-fraction-sum"]);
  assert.ok(choreography.steps[0]?.operationSubgraph.nodes.some(
    (node) => node.kind === "bifurcate-fraction-structure"
  ));
  assert.ok(choreography.steps[0]?.operationSubgraph.nodes.some(
    (node) => node.kind === "lower-numerator-operator"
  ));
});

test("split endpoints annotate semantic glyphs and structural fraction rules", () => {
  const asset = createNumeratorSplitMergeEquationKpAsset();
  for (const state of asset.bundle.objects) {
    const compiled = createKpNumeratorSplitMergeSelectorAnnotatedLatex(state);
    assert.ok(compiled);
    assert.deepEqual(
      compiled.annotated.annotations.map((annotation) => annotation.selectorId),
      state.selectors
        .filter((selector) => selector.kind !== "artifact")
        .map((selector) => selector.id)
    );
  }
  assert.equal(
    createKpNumeratorSplitMergeSelectorAnnotatedLatex(asset.bundle.objects[0]!)
      ?.structuralSelectorIds.length,
    1
  );
  assert.equal(
    createKpNumeratorSplitMergeSelectorAnnotatedLatex(asset.bundle.objects[1]!)
      ?.structuralSelectorIds.length,
    2
  );
});

test("fraction rules and denominators bifurcate at native scale while plus descends", () => {
  const geometry = splitGeometry();
  const middle = sampleKpEquationTokenMotion(geometry, 0.55);
  const branches = middle.tokens.filter((token) =>
    token.side === "target" &&
    (token.motionId.startsWith("target.rule") || token.motionId.startsWith("target.denominator"))
  );
  assert.equal(branches.length, 4);
  assert.ok(branches.every((token) => token.pose.opacity > 0));
  assert.ok(branches.every((token) => token.pose.scale === 1));
  assert.equal(new Set(branches.map((token) => token.pose.opacity)).size, 1);

  const plus = middle.tokens.find((token) => token.motionId === "source.plus");
  assert.ok(plus);
  assert.ok(plus.pose.y > 0);
  assert.equal(plus.pose.opacity, 1);

  const start = sampleKpEquationTokenMotion(geometry, 0);
  assert.ok(start.tokens.filter((token) => token.side === "source")
    .every((token) => token.pose.opacity === 1 && token.pose.x === 0 && token.pose.y === 0));
  assert.ok(start.tokens.filter((token) => token.side === "target")
    .every((token) => token.pose.opacity === 0));

  const end = sampleKpEquationTokenMotion(geometry, 1);
  assert.ok(end.tokens.filter((token) => token.side === "source")
    .every((token) => token.pose.opacity === 0));
  assert.ok(end.tokens.filter((token) => token.side === "target")
    .every((token) => token.pose.opacity === 1 && token.pose.x === 0 && token.pose.y === 0 && token.pose.scale === 1));
});

function splitGeometry(): KpMeasuredEquationTransitionGeometry {
  return {
    transitionId: "transition.numerator-split",
    linearRearrangementKind: "split-fraction-sum",
    sourceTokens: [
      token("source.2", 30, 10),
      token("source.x", 42, 10),
      token("source.plus", 56, 10),
      token("source.6", 70, 10),
      token("source.rule", 28, 30, 54),
      token("source.denominator", 52, 44)
    ],
    targetTokens: [
      token("target.2", 10, 10),
      token("target.x", 22, 10),
      token("target.rule.left", 8, 30, 30),
      token("target.denominator.left", 20, 44),
      token("target.plus", 52, 30),
      token("target.6", 78, 10),
      token("target.rule.right", 74, 30, 24),
      token("target.denominator.right", 82, 44)
    ],
    relations: [
      relation("coefficient-persists", "persist", ["source.2"], ["target.2"], -20, 0),
      relation("variable-persists", "persist", ["source.x"], ["target.x"], -20, 0),
      relation("plus-leaves-numerator", "role-change", ["source.plus"], ["target.plus"], -4, 20),
      relation("constant-persists", "persist", ["source.6"], ["target.6"], 8, 0),
      relation("fraction-rule-bifurcates", "split", ["source.rule"], ["target.rule.left", "target.rule.right"], 0, 0),
      relation("denominator-copies", "split", ["source.denominator"], ["target.denominator.left", "target.denominator.right"], 0, 0)
    ]
  };
}

function relation(
  recordId: string,
  lifecycle: "persist" | "role-change" | "split",
  sourceIds: readonly string[],
  targetIds: readonly string[],
  x: number,
  y: number
) {
  return {
    recordId,
    lifecycle,
    source: endpoint(sourceIds),
    target: endpoint(targetIds),
    delta: { x, y, scaleX: 1, scaleY: 1 }
  };
}

function endpoint(motionIds: readonly string[]): KpMeasuredEquationTransitionEndpoint {
  return {
    selectorIds: [...motionIds],
    motionIds: [...motionIds],
    bounds: { left: 28, top: 20, width: 54, height: 22 }
  };
}

function token(motionId: string, left: number, top: number, width = 12) {
  const rect = { left, top, width, height: 18 };
  return {
    motionId,
    text: motionId,
    rect,
    localRect: rect,
    element: { style: {}, dataset: {} } as unknown as HTMLElement
  };
}
