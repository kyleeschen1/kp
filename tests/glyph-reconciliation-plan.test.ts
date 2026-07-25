import assert from "node:assert/strict";
import test from "node:test";

import { projectKpCanonicalExecutionLineage } from "../src/animation/canonical-operation-lineage-adapter.ts";
import {
  createKpEphemeralGlyphReconciliationPlan,
  replaceKpReconciliationSteps,
  resolveKpGlyphReconciliationPlan
} from "../src/animation/glyph-reconciliation-plan.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpAnimationPresentationConstraintsV1 } from "../src/animation/presentation-constraints.ts";
import type { KpCanonicalOperationExecutionResult } from "../src/semantic/transformation-definition-binding.ts";
import type { KpLineageConstrainedGlyphMatchResult } from "../src/animation/lineage-constrained-glyph-matcher.ts";

const execution: KpCanonicalOperationExecutionResult = {
  kind: "canonical-operation-execution",
  transformationId: "solve-x",
  operationSpecId: "kp.core.persist",
  roleBindings: {},
  lineageGraph: {
    kind: "semantic-lineage-graph",
    id: "solve-x.lineage",
    sourceEntityIds: ["x.before"],
    targetEntityIds: ["x.after"],
    edges: [{
      id: "x",
      relation: "persist",
      sourceEntityIds: ["x.before"],
      targetEntityIds: ["x.after"],
      summary: "x persists"
    }]
  },
  correspondenceMap: { id: "solve-x.correspondence", records: [] }
};

test("ephemeral plan begins pending measurement and retains semantic authority", () => {
  const plan = createKpEphemeralGlyphReconciliationPlan({
    id: "plan.solve-x",
    lineage: projectKpCanonicalExecutionLineage(execution),
    constraints: createKpAnimationPresentationConstraintsV1({
      requiredCapabilities: ["accessibility", "direct-seek", "rewind"]
    })
  });

  assert.equal(plan.lifecycle, "renderer-session");
  assert.equal(plan.steps[0]?.disposition, "pending-measurement");
  assert.deepEqual(plan.steps[0]?.sourceEntityIds, ["x.before"]);
  assert.equal(plan.constraints.lineageAuthority, "canonical-operation-executor");
  assert.equal(Object.isFrozen(plan.steps), true);
});

test("ephemeral plan is not part of the durable animation asset schema", () => {
  const asset = createLinearSolveAnimationAsset();

  assert.equal("reconciliationPlan" in asset, false);
  assert.equal(JSON.stringify(asset).includes("renderer-session"), false);
});

test("ephemeral plan enforces the common planning-operation budget", () => {
  const plan = createKpEphemeralGlyphReconciliationPlan({
    id: "plan.budget",
    lineage: projectKpCanonicalExecutionLineage(execution),
    constraints: createKpAnimationPresentationConstraintsV1({
      requiredCapabilities: ["accessibility"],
      maxPlannerOperations: 1
    })
  });
  assert.throws(
    () => replaceKpReconciliationSteps(plan, plan.steps, 2),
    /limit is 1/
  );
});

test("ambiguity settles the whole semantic group and unmatched mappings cut", () => {
  const plan = createKpEphemeralGlyphReconciliationPlan({
    id: "plan.fallback",
    lineage: projectKpCanonicalExecutionLineage(execution),
    constraints: createKpAnimationPresentationConstraintsV1({
      requiredCapabilities: ["accessibility"],
      maxPlannerOperations: 100
    })
  });
  const base: KpLineageConstrainedGlyphMatchResult = {
    matches: [],
    multiplicity: [],
    unmatchedSourceGlyphIds: ["s.x"],
    unmatchedTargetGlyphIds: ["t.x"],
    ambiguities: [],
    operationCount: 2
  };

  assert.equal(resolveKpGlyphReconciliationPlan(plan, base).steps[0]?.disposition, "cut");
  assert.equal(
    resolveKpGlyphReconciliationPlan(plan, {
      ...base,
      ambiguities: [{
        lineageGroupId: plan.steps[0]!.lineageGroupId,
        glyphKey: "x",
        sourceGlyphIds: ["s.x"],
        targetGlyphIds: ["t.x"]
      }]
    }).steps[0]?.disposition,
    "settle"
  );
});

test("multiplicity uses the common group reconciliation disposition", () => {
  const plan = createKpEphemeralGlyphReconciliationPlan({
    id: "plan.merge",
    lineage: projectKpCanonicalExecutionLineage(execution),
    constraints: createKpAnimationPresentationConstraintsV1({
      requiredCapabilities: ["accessibility"],
      maxPlannerOperations: 100
    })
  });
  const groupId = plan.steps[0]!.lineageGroupId;
  const result: KpLineageConstrainedGlyphMatchResult = {
    matches: [],
    multiplicity: [{
      id: "merge",
      lineageGroupId: groupId,
      kind: "merge",
      sourceGlyphIds: ["s"],
      targetGlyphIds: ["t"],
      sharedMatchIds: []
    }],
    unmatchedSourceGlyphIds: ["s"],
    unmatchedTargetGlyphIds: ["t"],
    ambiguities: [],
    operationCount: 2
  };

  assert.equal(
    resolveKpGlyphReconciliationPlan(plan, result).steps[0]?.disposition,
    "group-reconcile"
  );
});
