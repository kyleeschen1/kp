import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  canSequenceKpSemanticTransformations,
  createKpSemanticTransformationDefinition,
  createKpSemanticTransformation,
  normalizeKpSemanticTransformationCorrespondence,
  validateKpSemanticTransformationDefinition,
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

test("transformation validation cannot bypass rich correspondence relation laws", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.invalid-rich", transformType: "test", title: "Invalid identity",
    sourceObjectIds: [initialEquation.id], targetObjectIds: [balancedEquation.id], preserves: [],
    correspondenceMap: { id: "map.invalid", records: [{ id: "bad", relation: "identity",
      sourceSelectorIds: ["eq0.x", "eq0.equals"], targetSelectorIds: ["eq1.x"], summary: "Not one-to-one" }] }
  });
  assert.ok(validateKpSemanticTransformation(transformation, bundle).some(issue => issue.path === "correspondenceMap.records[0]"));
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

test("createKpSemanticTransformation retains an isolated rich correspondence map", () => {
  const correspondenceMap = {
    id: "correspondence.subtract-both-sides",
    records: [
      {
        id: "unknown-persists",
        relation: "identity" as const,
        sourceSelectorIds: ["eq0.x"],
        targetSelectorIds: ["eq1.x"],
        summary: "The unknown keeps its semantic identity."
      },
      {
        id: "inverse-introduced",
        relation: "introduction" as const,
        sourceSelectorIds: [],
        targetSelectorIds: ["eq1.equals"],
        summary: "An inverse-operation marker enters the target presentation."
      }
    ]
  };
  const transformation = createKpSemanticTransformation({
    id: "transform.rich-correspondence",
    transformType: "subtractBothSides",
    title: "Subtract using rich correspondence",
    sourceObjectIds: ["equation.solve.initial"],
    targetObjectIds: ["equation.solve.with-inverses"],
    preserves: ["value"],
    correspondenceMap
  });

  correspondenceMap.records[0]!.sourceSelectorIds[0] = "mutated-outside";

  assert.deepEqual(transformation.correspondence, []);
  assert.deepEqual(transformation.correspondenceMap, {
    id: "correspondence.subtract-both-sides",
    records: [
      {
        id: "unknown-persists",
        relation: "identity",
        sourceSelectorIds: ["eq0.x"],
        targetSelectorIds: ["eq1.x"],
        summary: "The unknown keeps its semantic identity."
      },
      {
        id: "inverse-introduced",
        relation: "introduction",
        sourceSelectorIds: [],
        targetSelectorIds: ["eq1.equals"],
        summary: "An inverse-operation marker enters the target presentation."
      }
    ]
  });
  assert.deepEqual(validateKpSemanticTransformation(transformation, bundle), []);
});

test("validateKpSemanticTransformation reports missing rich correspondence selectors", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.bad-rich-correspondence",
    transformType: "simplify",
    title: "Broken rich correspondence",
    sourceObjectIds: ["equation.solve.initial"],
    targetObjectIds: ["equation.solve.with-inverses"],
    preserves: ["value"],
    correspondenceMap: {
      id: "correspondence.bad",
      records: [
        {
          id: "missing-endpoints",
          relation: "identity",
          sourceSelectorIds: ["eq0.missing"],
          targetSelectorIds: ["eq1.missing"],
          summary: "Invalid selectors should be diagnosed."
        }
      ]
    }
  });

  assert.deepEqual(validateKpSemanticTransformation(transformation, bundle), [
    {
      path: "correspondenceMap.records[0].sourceSelectorIds[0]",
      message:
        "Transformation transform.bad-rich-correspondence references missing rich-correspondence source selector eq0.missing."
    },
    {
      path: "correspondenceMap.records[0].targetSelectorIds[0]",
      message:
        "Transformation transform.bad-rich-correspondence references missing rich-correspondence target selector eq1.missing."
    }
  ]);
});

test("normalizeKpSemanticTransformationCorrespondence upgrades legacy pairs", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.normalize-legacy",
    transformType: "rewrite",
    title: "Normalize legacy selector pairs",
    sourceObjectIds: ["equation.solve.initial"],
    targetObjectIds: ["equation.solve.with-inverses"],
    preserves: ["value"],
    correspondence: [
      {
        sourceSelectorId: "eq0.x",
        targetSelectorId: "eq1.x",
        preserves: ["identity", "role"]
      },
      {
        sourceSelectorId: "eq0.equals",
        targetSelectorId: "eq1.equals",
        preserves: ["identity"],
        summary: "The relation keeps identity but changes presentation role."
      }
    ]
  });

  assert.deepEqual(normalizeKpSemanticTransformationCorrespondence(transformation), {
    id: "transform.normalize-legacy.correspondence",
    records: [
      {
        id: "legacy.0.eq0-x.to.eq1-x",
        relation: "identity",
        sourceSelectorIds: ["eq0.x"],
        targetSelectorIds: ["eq1.x"],
        summary: "Legacy selector correspondence from eq0.x to eq1.x."
      },
      {
        id: "legacy.1.eq0-equals.to.eq1-equals",
        relation: "role-change",
        sourceSelectorIds: ["eq0.equals"],
        targetSelectorIds: ["eq1.equals"],
        summary: "The relation keeps identity but changes presentation role."
      }
    ]
  });
});

test("normalizeKpSemanticTransformationCorrespondence preserves rich relations and supplements missing pairs", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.normalize-rich",
    transformType: "simplify",
    title: "Normalize rich relations",
    sourceObjectIds: ["equation.solve.initial"],
    targetObjectIds: ["equation.solve.with-inverses"],
    preserves: ["value"],
    correspondenceMap: {
      id: "correspondence.normalize-rich",
      records: [
        {
          id: "unknown-persists",
          relation: "identity",
          sourceSelectorIds: ["eq0.x"],
          targetSelectorIds: ["eq1.x"],
          summary: "Canonical rich identity."
        },
        {
          id: "terms-split",
          relation: "fan-out",
          sourceSelectorIds: ["eq0.factor"],
          targetSelectorIds: ["eq1.left-factor", "eq1.right-factor"],
          summary: "One factor becomes two."
        }
      ]
    },
    correspondence: [
      {
        sourceSelectorId: "eq0.x",
        targetSelectorId: "eq1.x",
        preserves: ["identity", "role"],
        summary: "Duplicate shorthand should not replace the rich record."
      },
      {
        sourceSelectorId: "eq0.equals",
        targetSelectorId: "eq1.equals",
        preserves: ["identity", "role"]
      },
      {
        sourceSelectorId: "eq0.factor",
        targetSelectorId: "eq1.right-factor",
        preserves: ["identity", "role"]
      }
    ]
  });

  assert.deepEqual(
    normalizeKpSemanticTransformationCorrespondence(transformation).records.map(
      (record) => [record.id, record.relation]
    ),
    [
      ["unknown-persists", "identity"],
      ["terms-split", "fan-out"],
      ["legacy.1.eq0-equals.to.eq1-equals", "identity"]
    ]
  );
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

test("createKpSemanticTransformationDefinition records reusable role templates", () => {
  const definition = createKpSemanticTransformationDefinition({
    id: "definition.linear-solve.subtract-both-sides",
    transformType: "subtractBothSides",
    title: "Subtract the same value from both sides",
    sourceObjectRoles: ["initial-equation"],
    targetObjectRoles: ["with-inverse-terms"],
    preserves: ["value", "structure"],
    assumptions: ["Subtracting equal quantities preserves equality."],
    lawRefs: [
      {
        id: "law.equation.subtract-both-sides",
        level: "strict"
      }
    ],
    correspondenceTemplates: [
      {
        sourceObjectRole: "initial-equation",
        sourceSelectorRole: "lhs.variable",
        targetObjectRole: "with-inverse-terms",
        targetSelectorRole: "lhs.variable",
        preserves: ["identity", "role"],
        summary: "The unknown persists across the balanced operation."
      }
    ]
  });

  assert.deepEqual(definition, {
    id: "definition.linear-solve.subtract-both-sides",
    kind: "semantic-transformation-definition",
    transformType: "subtractBothSides",
    title: "Subtract the same value from both sides",
    sourceObjectRoles: ["initial-equation"],
    targetObjectRoles: ["with-inverse-terms"],
    preserves: ["value", "structure"],
    correspondenceTemplates: [
      {
        sourceObjectRole: "initial-equation",
        sourceSelectorRole: "lhs.variable",
        targetObjectRole: "with-inverse-terms",
        targetSelectorRole: "lhs.variable",
        preserves: ["identity", "role"],
        summary: "The unknown persists across the balanced operation."
      }
    ],
    assumptions: ["Subtracting equal quantities preserves equality."],
    lawRefs: [
      {
        id: "law.equation.subtract-both-sides",
        level: "strict"
      }
    ]
  });
  assert.deepEqual(validateKpSemanticTransformationDefinition(definition), []);
});

test("validateKpSemanticTransformationDefinition reports broken role templates", () => {
  const definition = createKpSemanticTransformationDefinition({
    id: "definition.bad",
    transformType: "bad",
    title: "Bad definition",
    sourceObjectRoles: ["source"],
    targetObjectRoles: ["target"],
    preserves: ["value"],
    correspondenceTemplates: [
      {
        sourceObjectRole: "missing-source",
        sourceSelectorRole: "value",
        targetObjectRole: "target",
        targetSelectorRole: "value",
        preserves: ["identity"]
      },
      {
        sourceObjectRole: "source",
        sourceSelectorRole: "value",
        targetObjectRole: "missing-target",
        targetSelectorRole: "value",
        preserves: ["identity"]
      }
    ]
  });

  assert.deepEqual(validateKpSemanticTransformationDefinition(definition), [
    {
      path: "correspondenceTemplates[0].sourceObjectRole",
      message:
        "Transformation definition definition.bad references missing source object role missing-source."
    },
    {
      path: "correspondenceTemplates[1].targetObjectRole",
      message:
        "Transformation definition definition.bad references missing target object role missing-target."
    }
  ]);
});
