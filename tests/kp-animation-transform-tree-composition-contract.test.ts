import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpTransformTreeCompositionEquivalence
} from "../src/animation/transform-tree-composition-contract.ts";
import { createSemanticTransformationRef } from "../src/semantic/animation.ts";
import {
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../src/semantic/transformation-composition.ts";

test("transform tree composition equivalence accepts associative regrouping", () => {
  const a = leaf("transform.a", "object.source", "object.target");
  const b = leaf("transform.b", "object.source", "object.target");
  const c = leaf("transform.c", "object.2", "object.3");
  const left = createSemanticTransformationSequence({
    id: "tree.left",
    label: "Left grouped",
    children: [
      a,
      createSemanticTransformationSequence({
        id: "tree.left.tail",
        label: "Left tail",
        children: [b, c]
      })
    ]
  });
  const right = createSemanticTransformationSequence({
    id: "tree.right",
    label: "Right grouped",
    children: [
      createSemanticTransformationSequence({
        id: "tree.right.head",
        label: "Right head",
        children: [a, b]
      }),
      c
    ]
  });

  assert.deepEqual(
    checkKpTransformTreeCompositionEquivalence({
      id: "law.sequence-associativity",
      left,
      right
    }),
    {
      lawId: "transform-tree.composition-equivalence",
      passed: true,
      failures: []
    }
  );
});

test("transform tree composition equivalence reports order changes", () => {
  const a = leaf("transform.a", "object.source", "object.target");
  const b = leaf("transform.b", "object.source", "object.target");
  const left = createSemanticTransformationSequence({
    id: "tree.left",
    label: "Left",
    children: [a, b]
  });
  const right = createSemanticTransformationSequence({
    id: "tree.right",
    label: "Right",
    children: [b, a]
  });

  assert.deepEqual(
    checkKpTransformTreeCompositionEquivalence({
      id: "law.sequence-order",
      left,
      right
    }),
    {
      lawId: "transform-tree.composition-equivalence",
      passed: false,
      failures: [
        {
          path: "leafIds",
          message:
            "Transform-tree composition law.sequence-order must preserve leaf transformation order."
        },
        {
          path: "forwardPhases",
          message:
            "Transform-tree composition law.sequence-order must preserve forward phase structure."
        },
        {
          path: "rewindPhases",
          message:
            "Transform-tree composition law.sequence-order must preserve rewind phase structure."
        }
      ]
    }
  );
});

function leaf(id: string, sourceObjectId: string, targetObjectId: string) {
  return createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id,
      kind: "testTransform",
      sourceObjectIds: [sourceObjectId],
      targetObjectIds: [targetObjectId],
      preserves: ["structure"]
    })
  );
}
