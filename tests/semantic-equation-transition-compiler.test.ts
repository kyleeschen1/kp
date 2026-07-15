import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import { createKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import { compileKpSemanticEquationTransition } from "../src/rendering/semantic-equation-transition-compiler.ts";

const source = createKpSemanticAssetObject({
  id: "equation.before",
  objectType: "equation",
  title: "Before",
  value: { latex: "x + 3 = 7" },
  selectors: [
    { id: "before.x", kind: "term", label: "x" },
    { id: "before.equals", kind: "relation", label: "=" }
  ]
});
const target = createKpSemanticAssetObject({
  id: "equation.after",
  objectType: "equation",
  title: "After",
  value: { latex: "x = 4" },
  selectors: [
    { id: "after.x", kind: "term", label: "x" },
    { id: "after.equals", kind: "relation", label: "=" }
  ]
});
const bundle = createKpAssetBundle({
  id: "bundle.solve",
  title: "Solve",
  objects: [source, target]
});

test("compileKpSemanticEquationTransition compiles semantic objects and normalized correspondence", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.solve",
    transformType: "simplify",
    title: "Simplify",
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["value"],
    correspondence: [
      {
        sourceSelectorId: "before.x",
        targetSelectorId: "after.x",
        preserves: ["identity", "role"]
      },
      {
        sourceSelectorId: "before.equals",
        targetSelectorId: "after.equals",
        preserves: ["identity", "role"]
      }
    ]
  });

  const ir = compileKpSemanticEquationTransition({ transformation, bundle });

  assert.equal(ir.source[0]?.latex, "x + 3 = 7");
  assert.equal(ir.target[0]?.latex, "x = 4");
  assert.deepEqual(ir.source[0]?.selectors.map((selector) => selector.id), [
    "before.x",
    "before.equals"
  ]);
  assert.deepEqual(ir.relations.map((relation) => relation.lifecycle), [
    "persist",
    "persist"
  ]);
});

test("compileKpSemanticEquationTransition rejects non-equation states before rendering", () => {
  const graph = createKpSemanticAssetObject({
    id: "graph.after",
    objectType: "graph",
    title: "Graph",
    value: { points: [[0, 0]] }
  });
  const graphBundle = createKpAssetBundle({
    id: "bundle.graph",
    title: "Graph bundle",
    objects: [source, graph]
  });
  const transformation = createKpSemanticTransformation({
    id: "transform.to-graph",
    transformType: "reinterpret",
    title: "Show as graph",
    sourceObjectIds: [source.id],
    targetObjectIds: [graph.id],
    preserves: ["value"]
  });

  assert.throws(
    () => compileKpSemanticEquationTransition({
      transformation,
      bundle: graphBundle
    }),
    /target object graph.after does not expose non-empty LaTeX/
  );
});
