import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  findKpAssetSelector,
  validateKpAssetBundle
} from "../src/semantic/asset.ts";

test("createKpSemanticAssetObject creates an immutable semantic asset wrapper", () => {
  const object = createKpSemanticAssetObject({
    id: "equation.solve.initial",
    objectType: "equation",
    title: "Initial equation",
    value: {
      latex: "x + 3 = 7"
    },
    selectors: [
      {
        id: "equation.solve.initial.lhs.x",
        kind: "term",
        label: "x"
      },
      {
        id: "equation.solve.initial.equals",
        kind: "relation",
        label: "="
      }
    ],
    provenance: {
      kind: "authored",
      sourceIds: ["lesson.linear-solve"],
      summary: "Authored as the first linear-solve state."
    },
    metadata: {
      domain: "algebra"
    }
  });

  assert.deepEqual(object, {
    id: "equation.solve.initial",
    kind: "semantic-object",
    objectType: "equation",
    title: "Initial equation",
    value: {
      latex: "x + 3 = 7"
    },
    selectors: [
      {
        id: "equation.solve.initial.lhs.x",
        objectId: "equation.solve.initial",
        kind: "term",
        label: "x"
      },
      {
        id: "equation.solve.initial.equals",
        objectId: "equation.solve.initial",
        kind: "relation",
        label: "="
      }
    ],
    provenance: {
      kind: "authored",
      sourceIds: ["lesson.linear-solve"],
      summary: "Authored as the first linear-solve state."
    },
    metadata: {
      domain: "algebra"
    }
  });
  assert.deepEqual(JSON.parse(JSON.stringify(object)), object);
});

test("createKpAssetBundle validates object and selector closure", () => {
  const initial = createKpSemanticAssetObject({
    id: "equation.solve.initial",
    objectType: "equation",
    title: "Initial equation",
    value: { latex: "x + 3 = 7" },
    selectors: [
      {
        id: "equation.solve.initial.lhs.x",
        kind: "term",
        label: "x"
      }
    ]
  });
  const bundle = createKpAssetBundle({
    id: "asset.linear-solve",
    title: "Linear solve",
    objects: [initial]
  });

  assert.deepEqual(bundle, {
    id: "asset.linear-solve",
    title: "Linear solve",
    version: 1,
    objects: [initial]
  });
  assert.deepEqual(validateKpAssetBundle(bundle), []);
  assert.deepEqual(
    findKpAssetSelector(bundle, "equation.solve.initial.lhs.x"),
    {
      id: "equation.solve.initial.lhs.x",
      objectId: "equation.solve.initial",
      kind: "term",
      label: "x"
    }
  );
});

test("validateKpAssetBundle reports duplicate ids and selector mismatches", () => {
  const issues = validateKpAssetBundle({
    id: "asset.bad",
    title: "Bad asset",
    version: 1,
    objects: [
      {
        id: "equation.duplicate",
        kind: "semantic-object",
        objectType: "equation",
        title: "Equation A",
        value: {},
        selectors: [
          {
            id: "selector.duplicate",
            objectId: "equation.duplicate",
            kind: "term"
          },
          {
            id: "selector.duplicate",
            objectId: "other.object",
            kind: "term"
          }
        ]
      },
      {
        id: "equation.duplicate",
        kind: "semantic-object",
        objectType: "equation",
        title: "Equation B",
        value: {},
        selectors: []
      }
    ]
  });

  assert.deepEqual(issues, [
    {
      path: "objects[0].selectors[1].objectId",
      message:
        "Selector selector.duplicate must reference containing object equation.duplicate."
    },
    {
      path: "objects[0].selectors[1].id",
      message: "Duplicate asset selector id: selector.duplicate."
    },
    {
      path: "objects[1].id",
      message: "Duplicate asset object id: equation.duplicate."
    }
  ]);
});
