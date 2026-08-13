import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
} from "../src/domain-ir/public-api.ts";
import {
  compileKpSemanticEquationTransition as compileKpSemanticEquationTransitionCompatibility,
  compileKpSemanticEquationTransitionResult as compileKpSemanticEquationTransitionResultCompatibility
} from "../src/rendering/semantic-equation-transition-compiler.ts";
import { createKpSemanticLineageGraph } from "../src/semantic/semantic-lineage-graph.ts";
import type { KpCanonicalOperationExecutionResult } from "../src/semantic/transformation-definition-binding.ts";

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

test("rendering compatibility path preserves neutral compiler identity", () => {
  assert.equal(
    compileKpSemanticEquationTransitionCompatibility,
    compileKpSemanticEquationTransition
  );
  assert.equal(
    compileKpSemanticEquationTransitionResultCompatibility,
    compileKpSemanticEquationTransitionResult
  );
});

test("neutral semantic compiler contains no renderer resource state", () => {
  const source = readFileSync(
    new URL(
      "../src/domain-ir/semantic-equation-transition-compiler.ts",
      import.meta.url
    ),
    "utf8"
  );
  const forbidden = [
    /\bHTMLElement\b/,
    /\bSVGElement\b/,
    /\bCanvasRenderingContext/,
    /\bWebGL/,
    /\bTHREE\b/,
    /\bKaTeX\b/,
    /\bgetBoundingClientRect\b/,
    /\bquerySelector\b/,
    /\bdocument\./,
    /\bwindow\./
  ];
  for (const pattern of forbidden) {
    assert.doesNotMatch(source, pattern);
  }
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

test("semantic compilation consumes authoritative canonical operation execution", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.operation-execution",
    transformType: "persist",
    title: "Persist the unknown",
    sourceObjectIds: [source.id],
    targetObjectIds: [target.id],
    preserves: ["identity"],
    correspondence: [{
      sourceSelectorId: "before.equals",
      targetSelectorId: "after.equals",
      preserves: ["identity", "role"]
    }]
  });
  const operationExecution: KpCanonicalOperationExecutionResult = {
    kind: "canonical-operation-execution",
    transformationId: transformation.id,
    operationSpecId: "kp.core.persist.test",
    roleBindings: { before: ["before.x"], after: ["after.x"] },
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.operation-execution",
      sourceEntityIds: ["before.x"],
      targetEntityIds: ["after.x"],
      edges: [{
        id: "persist-x",
        relation: "persist",
        sourceEntityIds: ["before.x"],
        targetEntityIds: ["after.x"],
        summary: "The operation preserves x."
      }]
    }),
    correspondenceMap: {
      id: "correspondence.operation-execution",
      records: [{
        id: "persist-x",
        relation: "identity",
        sourceSelectorIds: ["before.x"],
        targetSelectorIds: ["after.x"],
        summary: "Compatibility projection of authoritative identity."
      }]
    }
  };

  const ir = compileKpSemanticEquationTransition({
    transformation,
    bundle,
    operationExecution
  });
  assert.deepEqual(ir.relations.map((relation) => ({
    relation: relation.relation,
    source: relation.sourceSelectorIds,
    target: relation.targetSelectorIds
  })), [{ relation: "identity", source: ["before.x"], target: ["after.x"] }]);
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

test("compile result diagnoses incomplete correspondence as a typed gap by default", () => {
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

  assert.equal(result.status, "gap");
  assert.equal(result.gap?.reason, "incomplete-lifecycle");
  assert.equal(result.gap?.repair.kind, "supply-correspondence");
  assert.equal("fallback" in result, false);
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
  assert.equal("fallback" in result, false);
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

  assert.equal(result.status, "gap");
  assert.equal(result.gap?.reason, "missing-definition-binding");
  assert.equal(result.gap?.repair.kind, "bind-operation");
  assert.equal(
    result.diagnostics[0]?.code,
    "semantic-transition.missing-definition-binding"
  );
});
