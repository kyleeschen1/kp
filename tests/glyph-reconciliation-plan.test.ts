import assert from "node:assert/strict";
import test from "node:test";

import { projectKpCanonicalExecutionLineage } from "../src/animation/canonical-operation-lineage-adapter.ts";
import {
  createKpEphemeralGlyphReconciliationPlan,
  replaceKpReconciliationSteps
} from "../src/animation/glyph-reconciliation-plan.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpAnimationPresentationConstraintsV1 } from "../src/animation/presentation-constraints.ts";
import type { KpCanonicalOperationExecutionResult } from "../src/semantic/transformation-definition-binding.ts";

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
