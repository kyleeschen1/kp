import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpSemanticTransformation,
  createKpSemanticTransformationDefinition
} from "../src/semantic/asset-transformation.ts";
import {
  compileKpSemanticEquationTransition,
  compileKpSemanticEquationTransitionResult
} from "../src/rendering/semantic-equation-transition-compiler.ts";

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

test("compileKpSemanticEquationTransition resolves definition roles into selector correspondence", () => {
  const definition = createKpSemanticTransformationDefinition({
    id: "definition.solve.simplify",
    transformType: "simplify",
    title: "Simplify an equation",
    sourceObjectRoles: ["before"],
    targetObjectRoles: ["after"],
    preserves: ["value"],
    correspondenceTemplates: [{
      sourceObjectRole: "before",
      sourceSelectorRole: "unknown",
      targetObjectRole: "after",
      targetSelectorRole: "unknown",
      preserves: ["identity", "role"],
      summary: "The unknown persists."
    }]
  });
  const transformation = createKpSemanticTransformation({
    id: "transform.definition-bound",
    definitionId: definition.id,
    transformType: definition.transformType,
    title: definition.title,
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["value"]
  });

  const ir = compileKpSemanticEquationTransition({
    transformation,
    bundle,
    definition,
    definitionBindings: {
      source: [{
        objectRole: "before",
        objectId: source.id,
        selectorIdsByRole: { unknown: "before.x" }
      }],
      target: [{
        objectRole: "after",
        objectId: target.id,
        selectorIdsByRole: { unknown: "after.x" }
      }]
    }
  });

  assert.deepEqual(ir.relations.map((relation) => ({
    relation: relation.relation,
    source: relation.sourceSelectorIds,
    target: relation.targetSelectorIds
  })), [{
    relation: "identity",
    source: ["before.x"],
    target: ["after.x"]
  }]);
});

test("definition binding rejects missing selector roles instead of guessing", () => {
  const definition = createKpSemanticTransformationDefinition({
    id: "definition.solve.missing-binding",
    transformType: "simplify",
    title: "Simplify an equation",
    sourceObjectRoles: ["before"],
    targetObjectRoles: ["after"],
    preserves: ["value"],
    correspondenceTemplates: [{
      sourceObjectRole: "before",
      sourceSelectorRole: "unknown",
      targetObjectRole: "after",
      targetSelectorRole: "unknown",
      preserves: ["identity"]
    }]
  });
  const transformation = createKpSemanticTransformation({
    id: "transform.missing-binding",
    definitionId: definition.id,
    transformType: definition.transformType,
    title: definition.title,
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["value"]
  });

  assert.throws(() => compileKpSemanticEquationTransition({
    transformation,
    bundle,
    definition,
    definitionBindings: {
      source: [{
        objectRole: "before",
        objectId: source.id,
        selectorIdsByRole: {}
      }],
      target: [{
        objectRole: "after",
        objectId: target.id,
        selectorIdsByRole: { unknown: "after.x" }
      }]
    }
  }), /missing source selector role binding before.unknown/);
});

test("compile result selects semantic rendering only with total selector lifecycle coverage", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.total-lifecycle",
    transformType: "simplify",
    title: "Simplify with complete correspondence",
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

  assert.deepEqual(compileKpSemanticEquationTransitionResult({
    transformation,
    bundle
  }).status, "semantic");
});

test("compile result diagnoses incomplete correspondence and whole-equation fallback", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.partial-lifecycle",
    transformType: "simplify",
    title: "Simplify with partial correspondence",
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["value"],
    correspondence: [{
      sourceSelectorId: "before.x",
      targetSelectorId: "after.x",
      preserves: ["identity", "role"]
    }]
  });

  const result = compileKpSemanticEquationTransitionResult({
    transformation,
    bundle
  });

  assert.equal(result.status, "fallback");
  assert.equal(result.fallback?.kind, "whole-equation-fade");
  assert.deepEqual(result.fallback?.reasons, [
    "semantic-transition.incomplete-lifecycle"
  ]);
  assert.match(result.diagnostics[0]?.message ?? "", /before.equals/);
});

test("generated compilation exposes an incomplete lifecycle as a typed gap without fading", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.generated-partial-lifecycle",
    transformType: "simplify",
    title: "Generated simplification with partial correspondence",
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["value"],
    correspondence: [{
      sourceSelectorId: "before.x",
      targetSelectorId: "after.x",
      preserves: ["identity", "role"]
    }]
  });

  const result = compileKpSemanticEquationTransitionResult({
    transformation,
    bundle,
    unsupportedPolicy: "typed-gap"
  });

  assert.equal(result.status, "gap");
  assert.equal(result.gap?.reason, "incomplete-lifecycle");
  assert.equal(result.gap?.repair.kind, "supply-correspondence");
  assert.equal(result.fallback, undefined);
});

test("compile result classifies missing definition bindings", () => {
  const definition = createKpSemanticTransformationDefinition({
    id: "definition.compile-result",
    transformType: "simplify",
    title: "Compile result definition",
    sourceObjectRoles: ["before"],
    targetObjectRoles: ["after"],
    preserves: ["value"]
  });
  const transformation = createKpSemanticTransformation({
    id: "transform.compile-result",
    definitionId: definition.id,
    transformType: definition.transformType,
    title: definition.title,
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["value"]
  });

  const result = compileKpSemanticEquationTransitionResult({
    transformation,
    bundle,
    definition
  });

  assert.equal(result.status, "fallback");
  assert.equal(
    result.diagnostics[0]?.code,
    "semantic-transition.missing-definition-binding"
  );
});
