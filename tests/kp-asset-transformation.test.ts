import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  canSequenceKpSemanticTransformations,
  createKpSemanticTransformation,
  validateKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";

const initialEquation = createKpSemanticAssetObject({
  id: "equation.solve.initial",
  objectType: "equation",
  title: "Initial equation",
  value: { latex: "x + 3 = 7" },
  selectors: [
    { id: "eq0.x", kind: "term", label: "x" },
    { id: "eq0.equals", kind: "relation", label: "=" }
  ]
});

const balancedEquation = createKpSemanticAssetObject({
  id: "equation.solve.with-inverses",
  objectType: "equation",
  title: "Subtract 3 from both sides",
  value: { latex: "x + 3 - 3 = 7 - 3" },
  selectors: [
    { id: "eq1.x", kind: "term", label: "x" },
    { id: "eq1.equals", kind: "relation", label: "=" }
  ],
  provenance: {
    kind: "transformed",
    sourceIds: ["equation.solve.initial"],
    transformationId: "transform.subtract-both-sides.3"
  }
});

const bundle = createKpAssetBundle({
  id: "asset.linear-solve",
  title: "Linear solve",
  objects: [initialEquation, balancedEquation]
});

test("createKpSemanticTransformation records source target and correspondence", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.subtract-both-sides.3",
    transformType: "subtractBothSides",
    title: "Subtract 3 from both sides",
    sourceObjectIds: ["equation.solve.initial"],
    targetObjectIds: ["equation.solve.with-inverses"],
    preserves: ["value", "structure"],
    correspondence: [
      {
        sourceSelectorId: "eq0.x",
        targetSelectorId: "eq1.x",
        preserves: ["identity", "role"],
        summary: "The unknown persists while the equation layout changes."
      },
      {
        sourceSelectorId: "eq0.equals",
        targetSelectorId: "eq1.equals",
        preserves: ["identity", "role"]
      }
    ],
    assumptions: ["3 has an additive inverse"],
    lawRefs: [
      {
        id: "law.equation.subtract-both-sides",
        level: "strict",
        summary: "Subtracting equal quantities preserves equation truth."
      }
    ]
  });

  assert.deepEqual(transformation, {
    id: "transform.subtract-both-sides.3",
    kind: "semantic-transformation",
    transformType: "subtractBothSides",
    title: "Subtract 3 from both sides",
    sourceObjectIds: ["equation.solve.initial"],
    targetObjectIds: ["equation.solve.with-inverses"],
    preserves: ["value", "structure"],
    correspondence: [
      {
        sourceSelectorId: "eq0.x",
        targetSelectorId: "eq1.x",
        preserves: ["identity", "role"],
        summary: "The unknown persists while the equation layout changes."
      },
      {
        sourceSelectorId: "eq0.equals",
        targetSelectorId: "eq1.equals",
        preserves: ["identity", "role"]
      }
    ],
    assumptions: ["3 has an additive inverse"],
    lawRefs: [
      {
        id: "law.equation.subtract-both-sides",
        level: "strict",
        summary: "Subtracting equal quantities preserves equation truth."
      }
    ]
  });
  assert.deepEqual(validateKpSemanticTransformation(transformation, bundle), []);
});

test("validateKpSemanticTransformation reports missing endpoints and selectors", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.bad",
    transformType: "subtractBothSides",
    title: "Bad transform",
    sourceObjectIds: ["equation.missing.source"],
    targetObjectIds: ["equation.missing.target"],
    preserves: ["value"],
    correspondence: [
      {
        sourceSelectorId: "eq0.missing",
        targetSelectorId: "eq1.x",
        preserves: ["identity"]
      },
      {
        sourceSelectorId: "eq0.x",
        targetSelectorId: "eq1.missing",
        preserves: ["identity"]
      }
    ]
  });

  assert.deepEqual(validateKpSemanticTransformation(transformation, bundle), [
    {
      path: "sourceObjectIds[0]",
      message:
        "Transformation transform.bad references missing source object equation.missing.source."
    },
    {
      path: "targetObjectIds[0]",
      message:
        "Transformation transform.bad references missing target object equation.missing.target."
    },
    {
      path: "correspondence[0].sourceSelectorId",
      message:
        "Transformation transform.bad references missing source selector eq0.missing."
    },
    {
      path: "correspondence[1].targetSelectorId",
      message:
        "Transformation transform.bad references missing target selector eq1.missing."
    }
  ]);
});

test("canSequenceKpSemanticTransformations checks adjacent object boundaries", () => {
  const first = createKpSemanticTransformation({
    id: "transform.first",
    transformType: "subtractBothSides",
    title: "First",
    sourceObjectIds: ["equation.solve.initial"],
    targetObjectIds: ["equation.solve.with-inverses"],
    preserves: ["value"]
  });
  const second = createKpSemanticTransformation({
    id: "transform.second",
    transformType: "cancelAdditiveInverses",
    title: "Second",
    sourceObjectIds: ["equation.solve.with-inverses"],
    targetObjectIds: ["equation.solve.cancelled"],
    preserves: ["value"]
  });
  const incompatible = createKpSemanticTransformation({
    id: "transform.incompatible",
    transformType: "simplify",
    title: "Incompatible",
    sourceObjectIds: ["equation.other"],
    targetObjectIds: ["equation.done"],
    preserves: ["value"]
  });

  assert.equal(canSequenceKpSemanticTransformations(first, second), true);
  assert.equal(canSequenceKpSemanticTransformations(first, incompatible), false);
});
