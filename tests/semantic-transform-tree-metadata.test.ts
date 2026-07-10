import assert from "node:assert/strict";
import test from "node:test";

import {
  createSemanticTransformationRef
} from "../src/semantic/animation.ts";
import {
  addSemanticTransformationTreeAnnotation,
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence,
  semanticTransformationForwardPhases,
  semanticTransformationRewindPhases,
  semanticTransformationTreeAnnotationsForNode,
  type SemanticTransformationTreeAnnotation
} from "../src/semantic/transformation-composition.ts";

function createSolveTree() {
  const subtract = createSemanticTransformationRef({
    id: "transform.subtract-both-sides.3",
    kind: "subtractBothSides",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.with-inverses"],
    preserves: ["value", "structure"]
  });
  const cancel = createSemanticTransformationRef({
    id: "transform.cancel-additive-inverse",
    kind: "cancelAdditiveInverse",
    sourceObjectIds: ["equation.with-inverses"],
    targetObjectIds: ["equation.simplified-left"],
    preserves: ["value"]
  });

  return createSemanticTransformationSequence({
    id: "solve-x.sequence",
    label: "Solve x",
    children: [
      createSemanticTransformationLeaf(subtract),
      createSemanticTransformationLeaf(cancel)
    ]
  });
}

test("editable transform tree annotations preserve semantic phase structure", () => {
  const tree = createSolveTree();
  const editableTree = createEditableSemanticTransformationTree({
    root: tree,
    annotations: [
      {
        id: "pause.after-subtract",
        kind: "pause",
        targetNodeId: "transform.subtract-both-sides.3",
        placement: "after",
        durationBeats: 2,
        summary: "Let the appended inverse terms register."
      },
      {
        id: "focus.cancel",
        kind: "focus",
        targetNodeId: "transform.cancel-additive-inverse",
        placement: "during",
        selectorIds: ["lhs.plus-3", "lhs.minus-3"],
        summary: "Emphasize the canceling terms."
      }
    ]
  });

  assert.deepEqual(semanticTransformationForwardPhases(editableTree.root), [
    ["transform.subtract-both-sides.3"],
    ["transform.cancel-additive-inverse"]
  ]);
  assert.deepEqual(semanticTransformationRewindPhases(editableTree.root), [
    ["transform.cancel-additive-inverse"],
    ["transform.subtract-both-sides.3"]
  ]);
  assert.deepEqual(editableTree.root.sourceObjectIds, ["equation.initial"]);
  assert.deepEqual(editableTree.root.targetObjectIds, ["equation.simplified-left"]);
  assert.deepEqual(editableTree.root.preserves, ["value"]);
  assert.deepEqual(
    semanticTransformationTreeAnnotationsForNode(
      editableTree,
      "transform.cancel-additive-inverse"
    ).map((annotation) => annotation.id),
    ["focus.cancel"]
  );
});

test("editable transform tree annotations are cloned and can be appended immutably", () => {
  const selectorIds = ["rhs.7", "rhs.minus-3"];
  const annotation: SemanticTransformationTreeAnnotation = {
    id: "emphasize.right-simplify",
    kind: "emphasis",
    targetNodeId: "transform.cancel-additive-inverse",
    placement: "during",
    selectorIds,
    summary: "Show the constant simplification target."
  };
  const firstTree = createEditableSemanticTransformationTree({
    root: createSolveTree(),
    annotations: [annotation]
  });

  selectorIds.push("rhs.4");
  const secondTree = addSemanticTransformationTreeAnnotation(firstTree, {
    id: "unfocus.cancel",
    kind: "unfocus",
    targetNodeId: "transform.cancel-additive-inverse",
    placement: "after",
    selectorIds: ["lhs.plus-3", "lhs.minus-3"]
  });

  assert.deepEqual(firstTree.annotations[0]?.selectorIds, ["rhs.7", "rhs.minus-3"]);
  assert.deepEqual(
    firstTree.annotations.map((candidate) => candidate.id),
    ["emphasize.right-simplify"]
  );
  assert.deepEqual(
    secondTree.annotations.map((candidate) => candidate.id),
    ["emphasize.right-simplify", "unfocus.cancel"]
  );
  assert.notEqual(firstTree, secondTree);
  assert.notEqual(firstTree.annotations, secondTree.annotations);
});

test("editable transform tree annotations must target existing transform nodes", () => {
  assert.throws(
    () =>
      createEditableSemanticTransformationTree({
        root: createSolveTree(),
        annotations: [
          {
            id: "pause.missing",
            kind: "pause",
            targetNodeId: "transform.missing",
            placement: "after"
          }
        ]
      }),
    /targets unknown transform node/
  );
});
