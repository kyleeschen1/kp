import assert from "node:assert/strict";
import test from "node:test";

import {
  createSemanticTransformationRef
} from "../src/semantic/animation.ts";
import {
  createSemanticTransformationLeaf,
  createSemanticTransformationParallel,
  createSemanticTransformationSequence,
  semanticTransformationAnnotationIdsForPhase,
  semanticTransformationForwardPhases,
  semanticTransformationLeafRefs,
  semanticTransformationRewindPhases
} from "../src/semantic/transformation-composition.ts";

test("semantic transformation sequence composes source, target, and rewind phases", () => {
  const subtract = createSemanticTransformationRef({
    id: "transform.subtract-both-sides.3",
    kind: "subtractBothSides",
    sourceObjectIds: ["equation.initial"],
    targetObjectIds: ["equation.with-inverses"],
    preserves: ["value", "structure"],
    summary: "Subtract 3 from both sides."
  });
  const cancel = createSemanticTransformationRef({
    id: "transform.cancel-additive-inverse",
    kind: "cancelAdditiveInverse",
    sourceObjectIds: ["equation.with-inverses"],
    targetObjectIds: ["equation.simplified-left"],
    preserves: ["value"],
    summary: "Cancel +3 and -3."
  });
  const sequence = createSemanticTransformationSequence({
    id: "solve-x.sequence",
    label: "Solve x",
    children: [
      createSemanticTransformationLeaf(subtract),
      createSemanticTransformationLeaf(cancel)
    ]
  });

  assert.equal(sequence.kind, "sequence");
  assert.deepEqual(sequence.sourceObjectIds, ["equation.initial"]);
  assert.deepEqual(sequence.targetObjectIds, ["equation.simplified-left"]);
  assert.deepEqual(sequence.preserves, ["value"]);
  assert.deepEqual(
    semanticTransformationLeafRefs(sequence).map((ref) => ref.id),
    ["transform.subtract-both-sides.3", "transform.cancel-additive-inverse"]
  );
  assert.deepEqual(semanticTransformationForwardPhases(sequence), [
    ["transform.subtract-both-sides.3"],
    ["transform.cancel-additive-inverse"]
  ]);
  assert.deepEqual(semanticTransformationRewindPhases(sequence), [
    ["transform.cancel-additive-inverse"],
    ["transform.subtract-both-sides.3"]
  ]);
  const annotations = [
    {
      id: "inspect.before-solve",
      kind: "pause" as const,
      targetNodeId: sequence.id,
      placement: "before" as const
    },
    {
      id: "focus.during-solve",
      kind: "focus" as const,
      targetNodeId: sequence.id,
      placement: "during" as const
    },
    {
      id: "inspect.after-solve",
      kind: "pause" as const,
      targetNodeId: sequence.id,
      placement: "after" as const
    }
  ];
  assert.deepEqual(semanticTransformationAnnotationIdsForPhase({
    root: sequence,
    phaseNodeIds: ["transform.subtract-both-sides.3"],
    direction: "forward",
    annotations
  }), {
    before: ["inspect.before-solve"],
    during: ["focus.during-solve"],
    after: []
  });
  assert.deepEqual(semanticTransformationAnnotationIdsForPhase({
    root: sequence,
    phaseNodeIds: ["transform.cancel-additive-inverse"],
    direction: "rewind",
    annotations
  }), {
    before: ["inspect.after-solve"],
    during: ["focus.during-solve"],
    after: []
  });
});

test("semantic transformation parallel composes independent child work into one phase", () => {
  const row1Dot = createSemanticTransformationRef({
    id: "dot.row1",
    kind: "dotProduct",
    sourceObjectIds: ["matrix.row1", "vector"],
    targetObjectIds: ["scalar.row1"],
    preserves: ["value", "structure"]
  });
  const row2Dot = createSemanticTransformationRef({
    id: "dot.row2",
    kind: "dotProduct",
    sourceObjectIds: ["matrix.row2", "vector"],
    targetObjectIds: ["scalar.row2"],
    preserves: ["value", "structure"]
  });
  const parallel = createSemanticTransformationParallel({
    id: "matrix-vector.rows",
    label: "Matrix-vector row products",
    children: [
      createSemanticTransformationLeaf(row1Dot),
      createSemanticTransformationLeaf(row2Dot)
    ]
  });

  assert.equal(parallel.kind, "parallel");
  assert.deepEqual(parallel.sourceObjectIds, [
    "matrix.row1",
    "vector",
    "matrix.row2"
  ]);
  assert.deepEqual(parallel.targetObjectIds, ["scalar.row1", "scalar.row2"]);
  assert.deepEqual(parallel.preserves, ["value", "structure"]);
  assert.deepEqual(semanticTransformationForwardPhases(parallel), [
    ["dot.row1", "dot.row2"]
  ]);
  assert.deepEqual(semanticTransformationRewindPhases(parallel), [
    ["dot.row1", "dot.row2"]
  ]);
});

test("semantic transformation groups reject empty composition", () => {
  assert.throws(
    () =>
      createSemanticTransformationSequence({
        id: "empty",
        label: "Empty",
        children: []
      }),
    /must contain at least one child/
  );
});
