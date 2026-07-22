import assert from "node:assert/strict";
import test from "node:test";

import { createDivideBothSidesEquationAnimationAsset } from "../src/animation/divide-both-sides-equation-adapter.ts";
import { createKpLinearRearrangementChoreography } from "../src/animation/linear-rearrangement-choreography.ts";
import { createKpEquationLinearRearrangementBindings } from "../src/rendering/equation-linear-rearrangement-bindings.ts";
import type {
  KpMeasuredEquationTransitionEndpoint,
  KpMeasuredEquationTransitionGeometry
} from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";
import { createDivideBothSidesEquationKpAsset } from "../src/semantic/divide-both-sides-equation-asset.ts";
import { createKpDivideBothSidesSelectorAnnotatedLatex } from "../src/rendering/divide-both-sides-selector-annotated-latex.ts";

test("divide asset binds a first-class divide-both-sides rearrangement", () => {
  const animation = createDivideBothSidesEquationAnimationAsset();
  const bindings = createKpEquationLinearRearrangementBindings(animation);
  assert.deepEqual(
    bindings.map((binding) => [binding.transformationId, binding.kind]),
    [
      ["transform.divide-both-sides.divide-by-3", "divide-both-sides"],
      ["transform.divide-both-sides.cancel-coefficient", "cancel-multiplicative-inverses"]
    ]
  );
  const choreography = createKpLinearRearrangementChoreography(animation);
  assert.equal(choreography.steps[0]?.kind, "divide-both-sides");
  assert.ok(choreography.steps[0]?.operationSubgraph.nodes.some(
    (node) => node.kind === "introduce-division-structure"
  ));
});

test("divide states annotate every semantic glyph and both fraction rules", () => {
  const asset = createDivideBothSidesEquationKpAsset();
  for (const state of asset.bundle.objects) {
    const compiled = createKpDivideBothSidesSelectorAnnotatedLatex(state);
    assert.ok(compiled);
    assert.deepEqual(
      compiled.annotated.annotations.map((annotation) => annotation.selectorId),
      state.selectors
        .filter((selector) => selector.kind !== "artifact")
        .map((selector) => selector.id)
    );
  }
  const divided = createKpDivideBothSidesSelectorAnnotatedLatex(asset.bundle.objects[1]!);
  assert.equal(divided?.structuralSelectorIds.length, 2);
  assert.match(divided!.annotated.rawLatex, /\\frac\{3x\}\{3\}.*\\frac\{12\}\{3\}/);
});

test("matched divisors and rules share one entry clock without deformation", () => {
  const before = sampleKpEquationTokenMotion(divideEntryGeometry(), 0.3);
  assert.ok(before.tokens.filter((token) => token.side === "target" && token.motionId.startsWith("structure."))
    .every((token) => token.pose.opacity === 0));

  const entering = sampleKpEquationTokenMotion(divideEntryGeometry(), 0.52);
  const structures = entering.tokens.filter(
    (token) => token.side === "target" && token.motionId.startsWith("structure.")
  );
  assert.equal(structures.length, 4);
  assert.equal(new Set(structures.map((token) => token.pose.opacity)).size, 1);
  assert.equal(new Set(structures.map((token) => token.pose.y)).size, 1);
  assert.ok(structures.every((token) => token.pose.scale === 1));
  assert.ok((entering.linearRearrangement?.structureEntryProgress ?? 0) > 0);

  const end = sampleKpEquationTokenMotion(divideEntryGeometry(), 1);
  assert.ok(end.tokens.filter((token) => token.side === "source")
    .every((token) => token.pose.opacity === 0));
  assert.ok(end.tokens.filter((token) => token.side === "target")
    .every((token) => token.pose.opacity === 1 && token.pose.x === 0 && token.pose.y === 0 && token.pose.scale === 1));
});

function divideEntryGeometry(): KpMeasuredEquationTransitionGeometry {
  return {
    transitionId: "transition.divide-entry",
    linearRearrangementKind: "divide-both-sides",
    sourceTokens: [
      token("source.3", 10, 20),
      token("source.x", 24, 20),
      token("source.equals", 58, 20),
      token("source.12", 84, 20)
    ],
    targetTokens: [
      token("target.3", 10, 8),
      token("target.x", 24, 8),
      token("structure.left-rule", 8, 28),
      token("structure.left-divisor", 19, 40),
      token("target.equals", 58, 20),
      token("target.12", 82, 8),
      token("structure.right-rule", 80, 28),
      token("structure.right-divisor", 87, 40)
    ],
    relations: [
      relation("coefficient", ["source.3"], ["target.3"], 0, -12),
      relation("variable", ["source.x"], ["target.x"], 0, -12),
      relation("equals", ["source.equals"], ["target.equals"], 0, 0),
      relation("constant", ["source.12"], ["target.12"], -2, -12),
      {
        recordId: "matched-divisors-enter",
        lifecycle: "enter",
        target: endpoint(["structure.left-divisor", "structure.right-divisor"], 19, 80)
      },
      {
        recordId: "fraction-rules-enter",
        lifecycle: "enter",
        target: endpoint(["structure.left-rule", "structure.right-rule"], 8, 92)
      }
    ]
  };
}

function relation(
  recordId: string,
  sourceIds: readonly string[],
  targetIds: readonly string[],
  x: number,
  y: number
) {
  return {
    recordId,
    lifecycle: "persist" as const,
    source: endpoint(sourceIds, 0, 12),
    target: endpoint(targetIds, x, 12),
    delta: { x, y, scaleX: 1, scaleY: 1 }
  };
}

function endpoint(
  motionIds: readonly string[],
  left: number,
  width: number
): KpMeasuredEquationTransitionEndpoint {
  return {
    selectorIds: [...motionIds],
    motionIds: [...motionIds],
    bounds: { left, top: 20, width, height: 18 }
  };
}

function token(motionId: string, left: number, top: number) {
  const rect = { left, top, width: 12, height: 18 };
  return {
    motionId,
    text: motionId,
    rect,
    localRect: rect,
    element: { style: {}, dataset: {} } as unknown as HTMLElement
  };
}
