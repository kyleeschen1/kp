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
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";
import {
  createKpSemanticTransitionGap,
  type KpSemanticTransitionGapReason
} from "../src/semantic/semantic-transition-gap.ts";
import type { KpCanonicalOperationExecutionResult } from "../src/semantic/transformation-definition-binding.ts";

const before = createKpSemanticAssetObject({
  id: "gap.before",
  objectType: "equation",
  title: "Before",
  value: { latex: "x + 3 = 7" },
  selectors: [
    { id: "gap.before.x", kind: "term", label: "x" },
    { id: "gap.before.equals", kind: "relation", label: "=" }
  ]
});
const after = createKpSemanticAssetObject({
  id: "gap.after",
  objectType: "equation",
  title: "After",
  value: { latex: "x = 4" },
  selectors: [
    { id: "gap.after.x", kind: "term", label: "x" },
    { id: "gap.after.equals", kind: "relation", label: "=" }
  ]
});
const bundle = createKpAssetBundle({
  id: "gap.bundle",
  title: "Gap fixtures",
  objects: [before, after]
});

test("every typed transition gap exposes one deterministic repair class", () => {
  const expectedRepair = new Map<KpSemanticTransitionGapReason, string>([
    ["missing-correspondence", "supply-correspondence"],
    ["incomplete-lifecycle", "supply-correspondence"],
    ["missing-definition-binding", "bind-operation"],
    ["invalid-reference", "repair-reference"],
    ["invalid-correspondence", "supply-correspondence"],
    ["unsupported-operation", "author-operation"],
    ["compile-failed", "author-operation"]
  ]);

  for (const [reason, repairKind] of expectedRepair) {
    const gap = createKpSemanticTransitionGap({
      transformationId: `gap.${reason}`,
      reason,
      diagnostics: [{
        code: `semantic-transition.${reason}`,
        severity: "error",
        message: `${reason} fixture`
      }]
    });

    assert.equal(gap.kind, "semantic-transition-gap");
    assert.equal(gap.id, `semantic-gap.gap.${reason}`);
    assert.equal(gap.reason, reason);
    assert.equal(gap.repair.kind, repairKind);
    assert.equal(gap.repair.targetId, `gap.${reason}`);
    assert.deepEqual(gap.diagnostics.map(({ code }) => code), [
      `semantic-transition.${reason}`
    ]);
  }
});

test("compiler preserves typed diagnostics for missing and partial correspondence", () => {
  const missing = createKpSemanticTransformation({
    id: "gap.transform.missing-correspondence",
    transformType: "simplify",
    title: "No correspondence",
    sourceObjectIds: [before.id],
    targetObjectIds: [after.id],
    preserves: ["value"]
  });
  const partial = createKpSemanticTransformation({
    id: "gap.transform.partial-correspondence",
    transformType: "simplify",
    title: "Partial correspondence",
    sourceObjectIds: [before.id],
    targetObjectIds: [after.id],
    preserves: ["value"],
    correspondence: [{
      sourceSelectorId: "gap.before.x",
      targetSelectorId: "gap.after.x",
      preserves: ["identity"]
    }]
  });

  assertGap(
    compileKpSemanticEquationTransitionResult({
      transformation: missing,
      bundle,
      unsupportedPolicy: "typed-gap"
    }),
    "semantic-transition.no-correspondence",
    "missing-correspondence",
    "supply-correspondence"
  );
  assertGap(
    compileKpSemanticEquationTransitionResult({
      transformation: partial,
      bundle,
      unsupportedPolicy: "typed-gap"
    }),
    "semantic-transition.incomplete-lifecycle",
    "incomplete-lifecycle",
    "supply-correspondence"
  );
});

test("compiler preserves typed diagnostics for missing definition bindings", () => {
  const definition = createKpSemanticTransformationDefinition({
    id: "gap.definition.binding",
    transformType: "simplify",
    title: "Definition binding fixture",
    sourceObjectRoles: ["before"],
    targetObjectRoles: ["after"],
    preserves: ["value"]
  });
  const transformation = createKpSemanticTransformation({
    id: "gap.transform.binding",
    definitionId: definition.id,
    transformType: definition.transformType,
    title: definition.title,
    sourceObjectIds: [before.id],
    targetObjectIds: [after.id],
    preserves: ["value"]
  });

  assertGap(
    compileKpSemanticEquationTransitionResult({
      transformation,
      bundle,
      definition,
      unsupportedPolicy: "typed-gap"
    }),
    "semantic-transition.missing-definition-binding",
    "missing-definition-binding",
    "bind-operation"
  );
});

test("compiler preserves typed diagnostics for invalid references", () => {
  const transformation = createKpSemanticTransformation({
    id: "gap.transform.invalid-reference",
    transformType: "simplify",
    title: "Invalid reference fixture",
    sourceObjectIds: [before.id],
    targetObjectIds: ["gap.after.missing"],
    preserves: ["value"]
  });

  assertGap(
    compileKpSemanticEquationTransitionResult({
      transformation,
      bundle,
      unsupportedPolicy: "typed-gap"
    }),
    "semantic-transition.invalid-reference",
    "invalid-reference",
    "repair-reference"
  );
});

test("compiler preserves typed diagnostics for invalid correspondence", () => {
  const transformation = createKpSemanticTransformation({
    id: "gap.transform.invalid-correspondence",
    transformType: "simplify",
    title: "Invalid correspondence fixture",
    sourceObjectIds: [before.id],
    targetObjectIds: [after.id],
    preserves: ["value"],
    correspondence: [{
      sourceSelectorId: "gap.before.missing",
      targetSelectorId: "gap.after.x",
      preserves: ["identity"]
    }]
  });

  assertGap(
    compileKpSemanticEquationTransitionResult({
      transformation,
      bundle,
      unsupportedPolicy: "typed-gap"
    }),
    "semantic-transition.invalid-correspondence",
    "invalid-correspondence",
    "supply-correspondence"
  );
});

test("compiler preserves a typed author-operation repair for unknown failures", () => {
  const transformation = createKpSemanticTransformation({
    id: "gap.transform.compile-failed",
    transformType: "simplify",
    title: "Compile failure fixture",
    sourceObjectIds: [before.id],
    targetObjectIds: [after.id],
    preserves: ["value"]
  });
  const operationExecution: KpCanonicalOperationExecutionResult = {
    kind: "canonical-operation-execution",
    transformationId: "gap.transform.somewhere-else",
    operationSpecId: "gap.operation",
    roleBindings: {},
    lineageGraph: {
      kind: "semantic-lineage-graph",
      id: "gap.lineage",
      sourceEntityIds: [],
      targetEntityIds: [],
      edges: []
    },
    correspondenceMap: {
      id: "gap.correspondence",
      records: []
    }
  };

  assertGap(
    compileKpSemanticEquationTransitionResult({
      transformation,
      bundle,
      operationExecution,
      unsupportedPolicy: "typed-gap"
    }),
    "semantic-transition.compile-failed",
    "compile-failed",
    "author-operation"
  );
});

function assertGap(
  result: ReturnType<typeof compileKpSemanticEquationTransitionResult>,
  diagnosticCode: string,
  reason: KpSemanticTransitionGapReason,
  repairKind: string
): void {
  assert.equal(result.status, "gap");
  assert.equal(result.diagnostics[0]?.code, diagnosticCode);
  assert.equal(result.gap?.reason, reason);
  assert.equal(result.gap?.repair.kind, repairKind);
  assert.equal("fallback" in result, false);
}
