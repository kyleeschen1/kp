import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  createKpSemanticDiagramParallel,
  createKpSemanticDiagramSequence,
  createKpSemanticDiagramTree,
  createKpTransformationDiagramLeaf,
  kpSemanticDiagramForwardPhases,
  kpSemanticDiagramLeafTransformationIds,
  kpSemanticDiagramRewindPhases
} from "../src/semantic/asset-diagram.ts";

const subtract = createKpSemanticTransformation({
  id: "transform.subtract-both-sides.3",
  transformType: "subtractBothSides",
  title: "Subtract 3 from both sides",
  sourceObjectIds: ["equation.initial"],
  targetObjectIds: ["equation.with-inverses"],
  preserves: ["value", "structure"]
});

const cancel = createKpSemanticTransformation({
  id: "transform.cancel-additive-inverses",
  transformType: "cancelAdditiveInverses",
  title: "Cancel additive inverses",
  sourceObjectIds: ["equation.with-inverses"],
  targetObjectIds: ["equation.cancelled"],
  preserves: ["value"]
});

test("createKpSemanticDiagramSequence composes transformation boundaries", () => {
  const diagram = createKpSemanticDiagramSequence({
    id: "diagram.linear-solve",
    title: "Linear solve",
    children: [
      createKpTransformationDiagramLeaf(subtract),
      createKpTransformationDiagramLeaf(cancel)
    ]
  });

  assert.equal(diagram.kind, "sequence");
  assert.deepEqual(diagram.sourceObjectIds, ["equation.initial"]);
  assert.deepEqual(diagram.targetObjectIds, ["equation.cancelled"]);
  assert.deepEqual(diagram.preserves, ["value"]);
  assert.deepEqual(kpSemanticDiagramLeafTransformationIds(diagram), [
    "transform.subtract-both-sides.3",
    "transform.cancel-additive-inverses"
  ]);
  assert.deepEqual(kpSemanticDiagramForwardPhases(diagram), [
    ["transform.subtract-both-sides.3"],
    ["transform.cancel-additive-inverses"]
  ]);
  assert.deepEqual(kpSemanticDiagramRewindPhases(diagram), [
    ["transform.cancel-additive-inverses"],
    ["transform.subtract-both-sides.3"]
  ]);
});

test("createKpSemanticDiagramSequence rejects incompatible boundaries", () => {
  const incompatible = createKpSemanticTransformation({
    id: "transform.unrelated",
    transformType: "simplify",
    title: "Unrelated",
    sourceObjectIds: ["equation.other"],
    targetObjectIds: ["equation.done"],
    preserves: ["value"]
  });

  assert.throws(
    () =>
      createKpSemanticDiagramSequence({
        id: "diagram.bad",
        title: "Bad",
        children: [
          createKpTransformationDiagramLeaf(subtract),
          createKpTransformationDiagramLeaf(incompatible)
        ]
      }),
    /cannot sequence child 0 into child 1/
  );
});

test("createKpSemanticDiagramParallel composes independent branches into one phase", () => {
  const left = createKpSemanticTransformation({
    id: "transform.left",
    transformType: "focus",
    title: "Focus left",
    sourceObjectIds: ["equation.left"],
    targetObjectIds: ["equation.left.focused"],
    preserves: ["identity", "presentation"]
  });
  const right = createKpSemanticTransformation({
    id: "transform.right",
    transformType: "focus",
    title: "Focus right",
    sourceObjectIds: ["equation.right"],
    targetObjectIds: ["equation.right.focused"],
    preserves: ["identity", "presentation"]
  });
  const diagram = createKpSemanticDiagramParallel({
    id: "diagram.focus-both-sides",
    title: "Focus both sides",
    children: [
      createKpTransformationDiagramLeaf(left),
      createKpTransformationDiagramLeaf(right)
    ]
  });

  assert.equal(diagram.kind, "parallel");
  assert.deepEqual(diagram.sourceObjectIds, ["equation.left", "equation.right"]);
  assert.deepEqual(diagram.targetObjectIds, [
    "equation.left.focused",
    "equation.right.focused"
  ]);
  assert.deepEqual(diagram.preserves, ["identity", "presentation"]);
  assert.deepEqual(kpSemanticDiagramForwardPhases(diagram), [
    ["transform.left", "transform.right"]
  ]);
  assert.deepEqual(kpSemanticDiagramRewindPhases(diagram), [
    ["transform.left", "transform.right"]
  ]);
});

test("createKpSemanticDiagramTree substitutes child detail under a parent transform", () => {
  const dotParent = createKpSemanticTransformation({
    id: "transform.matrix-vector.row1",
    transformType: "dotProduct",
    title: "Row 1 dot product",
    sourceObjectIds: ["matrix.row1", "vector.x"],
    targetObjectIds: ["scalar.row1"],
    preserves: ["value"]
  });
  const multiply = createKpSemanticTransformation({
    id: "transform.row1.multiply",
    transformType: "multiplyComponents",
    title: "Multiply components",
    sourceObjectIds: ["matrix.row1", "vector.x"],
    targetObjectIds: ["row1.products"],
    preserves: ["value"]
  });
  const sum = createKpSemanticTransformation({
    id: "transform.row1.sum",
    transformType: "sumProducts",
    title: "Sum products",
    sourceObjectIds: ["row1.products"],
    targetObjectIds: ["scalar.row1"],
    preserves: ["value"]
  });
  const child = createKpSemanticDiagramSequence({
    id: "diagram.row1-dot-detail",
    title: "Row 1 dot product detail",
    children: [
      createKpTransformationDiagramLeaf(multiply),
      createKpTransformationDiagramLeaf(sum)
    ]
  });
  const tree = createKpSemanticDiagramTree({
    id: "diagram.row1-dot-tree",
    title: "Row 1 dot product tree",
    parent: dotParent,
    child
  });

  assert.equal(tree.kind, "tree");
  assert.equal(tree.parentTransformation.id, "transform.matrix-vector.row1");
  assert.deepEqual(tree.sourceObjectIds, ["matrix.row1", "vector.x"]);
  assert.deepEqual(tree.targetObjectIds, ["scalar.row1"]);
  assert.deepEqual(kpSemanticDiagramForwardPhases(tree), [
    ["transform.row1.multiply"],
    ["transform.row1.sum"]
  ]);
});
