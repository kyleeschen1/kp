import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createEquationOperationTransition,
  type EquationTransition
} from "../src/math/equation-transform.ts";

type TokenSummary = [
  id: string,
  lifecycle: string,
  sourceMotionId: string | undefined,
  targetMotionId: string | undefined
];
type CorrespondenceSummary = [
  id: string,
  relation: string,
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[]
];

const summarizeTokens = (transition: EquationTransition): TokenSummary[] =>
  transition.tokens.map((token) => [
    token.id,
    token.lifecycle,
    token.sourceMotionId,
    token.targetMotionId
  ]);

const requireCorrespondenceMap = (transition: EquationTransition) => {
  assert.ok(transition.correspondenceMap, "transition should include a map");
  return transition.correspondenceMap;
};

const requireSelectorPaths = (transition: EquationTransition) => {
  assert.ok(transition.selectorPaths, "transition should include selector paths");
  return transition.selectorPaths;
};

const summarizeCorrespondence = (
  transition: EquationTransition
): CorrespondenceSummary[] =>
  requireCorrespondenceMap(transition).records.map((record) => [
    record.id,
    record.relation,
    record.sourceSelectorIds,
    record.targetSelectorIds
  ]);

const assertAnnotationsCoverReferencedMotionIds = (
  transition: EquationTransition
) => {
  const sourceMotionIds = new Set(
    transition.sourceAnnotations.map((annotation) => annotation.motionId)
  );
  const targetMotionIds = new Set(
    transition.targetAnnotations.map((annotation) => annotation.motionId)
  );

  for (const token of transition.tokens) {
    if (token.sourceMotionId !== undefined) {
      assert.equal(
        sourceMotionIds.has(token.sourceMotionId),
        true,
        `missing source annotation for ${token.sourceMotionId}`
      );
    }
    if (token.targetMotionId !== undefined) {
      assert.equal(
        targetMotionIds.has(token.targetMotionId),
        true,
        `missing target annotation for ${token.targetMotionId}`
      );
    }
  }
};

test("createEquationOperationTransition creates subtractBothSides(3) motion tokens", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });

  assert.equal(transition.sourceLatex, "x + 3 = 7");
  assert.equal(transition.targetLatex, "x + 3 - 3 = 7 - 3");
  assert.equal(
    requireCorrespondenceMap(transition).id,
    "linear-equation.subtract-both-sides.3"
  );
  assert.deepEqual(summarizeTokens(transition), [
    ["lhs.x", "persist", "lhs.x", "lhs.x"],
    ["lhs.plus", "persist", "lhs.plus", "lhs.plus"],
    ["lhs.3", "persist", "lhs.3", "lhs.3"],
    ["lhs.inverse.minus", "inverse-enter", undefined, "lhs.inverse.minus"],
    ["lhs.inverse.3", "inverse-enter", undefined, "lhs.inverse.3"],
    ["equals", "persist", "equals", "equals"],
    ["rhs.7", "persist", "rhs.7", "rhs.7"],
    ["rhs.inverse.minus", "inverse-enter", undefined, "rhs.inverse.minus"],
    ["rhs.inverse.3", "inverse-enter", undefined, "rhs.inverse.3"]
  ]);
  assert.deepEqual(requireSelectorPaths(transition), {
    source: {
      "lhs.x": "equation.left.left",
      "lhs.plus": "equation.left.operator",
      "lhs.3": "equation.left.right",
      equals: "equation.relation",
      "rhs.7": "equation.right"
    },
    target: {
      "lhs.x": "equation.left.left.left",
      "lhs.plus": "equation.left.left.operator",
      "lhs.3": "equation.left.left.right",
      "lhs.inverse.minus": "equation.left.operator",
      "lhs.inverse.3": "equation.left.right",
      equals: "equation.relation",
      "rhs.7": "equation.right.left",
      "rhs.inverse.minus": "equation.right.operator",
      "rhs.inverse.3": "equation.right.right"
    }
  });
  assert.deepEqual(summarizeCorrespondence(transition), [
    ["identity.lhs.x", "identity", ["lhs.x"], ["lhs.x"]],
    ["identity.lhs.plus", "identity", ["lhs.plus"], ["lhs.plus"]],
    ["identity.lhs.3", "identity", ["lhs.3"], ["lhs.3"]],
    ["identity.equals", "identity", ["equals"], ["equals"]],
    ["identity.rhs.7", "identity", ["rhs.7"], ["rhs.7"]],
    ["introduction.lhs.inverse.minus", "introduction", [], ["lhs.inverse.minus"]],
    ["introduction.lhs.inverse.3", "introduction", [], ["lhs.inverse.3"]],
    ["introduction.rhs.inverse.minus", "introduction", [], ["rhs.inverse.minus"]],
    ["introduction.rhs.inverse.3", "introduction", [], ["rhs.inverse.3"]]
  ]);
  assert.deepEqual(transition.sourceAnnotations, [
    { motionId: "lhs.x", text: "x" },
    { motionId: "lhs.plus", text: "+" },
    { motionId: "lhs.3", text: "3" },
    { motionId: "equals", text: "=" },
    { motionId: "rhs.7", text: "7" }
  ]);
  assert.deepEqual(transition.targetAnnotations, [
    { motionId: "lhs.x", text: "x" },
    { motionId: "lhs.plus", text: "+" },
    { motionId: "lhs.3", text: "3" },
    { motionId: "lhs.inverse.minus", text: "-" },
    { motionId: "lhs.inverse.3", text: "3" },
    { motionId: "equals", text: "=" },
    { motionId: "rhs.7", text: "7" },
    { motionId: "rhs.inverse.minus", text: "-" },
    { motionId: "rhs.inverse.3", text: "3" }
  ]);
  assert.deepEqual(transition.tokens[0], {
    id: "lhs.x",
    lifecycle: "persist",
    label: "x",
    sourceMotionId: "lhs.x",
    targetMotionId: "lhs.x",
    sourceLatex: "x",
    targetLatex: "x"
  });
  assert.deepEqual(transition.tokens[1], {
    id: "lhs.plus",
    lifecycle: "persist",
    label: "+",
    sourceMotionId: "lhs.plus",
    targetMotionId: "lhs.plus",
    sourceLatex: "+",
    targetLatex: "+"
  });
  assert.deepEqual(transition.tokens[3], {
    id: "lhs.inverse.minus",
    lifecycle: "inverse-enter",
    label: "-",
    targetMotionId: "lhs.inverse.minus",
    targetLatex: "-"
  });
  assertAnnotationsCoverReferencedMotionIds(transition);
});

test("createEquationOperationTransition creates left simplification motion tokens", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });

  assert.equal(transition.sourceLatex, "x + 3 - 3 = 7 - 3");
  assert.equal(transition.targetLatex, "x = 7 - 3");
  assert.equal(
    requireCorrespondenceMap(transition).id,
    "linear-equation.cancel-left-additive-inverse"
  );
  assert.deepEqual(summarizeTokens(transition), [
    ["lhs.x", "persist", "lhs.x", "lhs.x"],
    ["lhs.plus", "cancel", "lhs.plus", undefined],
    ["lhs.3", "cancel", "lhs.3", undefined],
    ["lhs.inverse.minus", "cancel", "lhs.inverse.minus", undefined],
    ["lhs.inverse.3", "cancel", "lhs.inverse.3", undefined],
    ["equals", "persist", "equals", "equals"],
    ["rhs.7", "persist", "rhs.7", "rhs.7"],
    ["rhs.inverse.minus", "persist", "rhs.inverse.minus", "rhs.inverse.minus"],
    ["rhs.inverse.3", "persist", "rhs.inverse.3", "rhs.inverse.3"]
  ]);
  assert.deepEqual(requireSelectorPaths(transition), {
    source: {
      "lhs.x": "equation.left.left.left",
      "lhs.plus": "equation.left.left.operator",
      "lhs.3": "equation.left.left.right",
      "lhs.inverse.minus": "equation.left.operator",
      "lhs.inverse.3": "equation.left.right",
      equals: "equation.relation",
      "rhs.7": "equation.right.left",
      "rhs.inverse.minus": "equation.right.operator",
      "rhs.inverse.3": "equation.right.right"
    },
    target: {
      "lhs.x": "equation.left",
      equals: "equation.relation",
      "rhs.7": "equation.right.left",
      "rhs.inverse.minus": "equation.right.operator",
      "rhs.inverse.3": "equation.right.right"
    }
  });
  assert.deepEqual(summarizeCorrespondence(transition), [
    ["identity.lhs.x", "identity", ["lhs.x"], ["lhs.x"]],
    [
      "cancelation.lhs.additive-inverse",
      "cancelation",
      ["lhs.plus", "lhs.3", "lhs.inverse.minus", "lhs.inverse.3"],
      []
    ],
    ["identity.equals", "identity", ["equals"], ["equals"]],
    ["identity.rhs.7", "identity", ["rhs.7"], ["rhs.7"]],
    [
      "identity.rhs.inverse.minus",
      "identity",
      ["rhs.inverse.minus"],
      ["rhs.inverse.minus"]
    ],
    ["identity.rhs.inverse.3", "identity", ["rhs.inverse.3"], ["rhs.inverse.3"]]
  ]);
  assert.deepEqual(transition.sourceAnnotations, [
    { motionId: "lhs.x", text: "x" },
    { motionId: "lhs.plus", text: "+" },
    { motionId: "lhs.3", text: "3" },
    { motionId: "lhs.inverse.minus", text: "-" },
    { motionId: "lhs.inverse.3", text: "3" },
    { motionId: "equals", text: "=" },
    { motionId: "rhs.7", text: "7" },
    { motionId: "rhs.inverse.minus", text: "-" },
    { motionId: "rhs.inverse.3", text: "3" }
  ]);
  assert.deepEqual(transition.targetAnnotations, [
    { motionId: "lhs.x", text: "x" },
    { motionId: "equals", text: "=" },
    { motionId: "rhs.7", text: "7" },
    { motionId: "rhs.inverse.minus", text: "-" },
    { motionId: "rhs.inverse.3", text: "3" }
  ]);
  assertAnnotationsCoverReferencedMotionIds(transition);
});

test("createEquationOperationTransition creates right simplification motion tokens", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });

  assert.equal(transition.sourceLatex, "x = 7 - 3");
  assert.equal(transition.targetLatex, "x = 4");
  assert.equal(
    requireCorrespondenceMap(transition).id,
    "linear-equation.evaluate-right-constant-difference"
  );
  assert.deepEqual(summarizeTokens(transition), [
    ["lhs.x", "persist", "lhs.x", "lhs.x"],
    ["equals", "persist", "equals", "equals"],
    ["rhs.7", "simplify-into", "rhs.7", undefined],
    ["rhs.inverse.minus", "simplify-into", "rhs.inverse.minus", undefined],
    ["rhs.inverse.3", "simplify-into", "rhs.inverse.3", undefined],
    ["rhs.4", "enter", undefined, "rhs.4"]
  ]);
  assert.deepEqual(requireSelectorPaths(transition), {
    source: {
      "lhs.x": "equation.left",
      equals: "equation.relation",
      "rhs.7": "equation.right.left",
      "rhs.inverse.minus": "equation.right.operator",
      "rhs.inverse.3": "equation.right.right"
    },
    target: {
      "lhs.x": "equation.left",
      equals: "equation.relation",
      "rhs.4": "equation.right"
    }
  });
  assert.deepEqual(summarizeCorrespondence(transition), [
    ["identity.lhs.x", "identity", ["lhs.x"], ["lhs.x"]],
    ["identity.equals", "identity", ["equals"], ["equals"]],
    [
      "fan-in.rhs.constant-difference",
      "fan-in",
      ["rhs.7", "rhs.inverse.minus", "rhs.inverse.3"],
      ["rhs.4"]
    ]
  ]);
  assert.deepEqual(transition.sourceAnnotations, [
    { motionId: "lhs.x", text: "x" },
    { motionId: "equals", text: "=" },
    { motionId: "rhs.7", text: "7" },
    { motionId: "rhs.inverse.minus", text: "-" },
    { motionId: "rhs.inverse.3", text: "3" }
  ]);
  assert.deepEqual(transition.targetAnnotations, [
    { motionId: "lhs.x", text: "x" },
    { motionId: "equals", text: "=" },
    { motionId: "rhs.4", text: "4" }
  ]);
  assertAnnotationsCoverReferencedMotionIds(transition);
});

test("createEquationOperationTransition rejects unsupported source and operation pairs", () => {
  assert.throws(
    () =>
      createEquationOperationTransition({
        sourceLatex: "x = 7",
        operation: {
          kind: "subtractBothSides",
          valueLatex: "3"
        }
      }),
    new Error("Unsupported equation operation transition.")
  );
});
