import assert from "node:assert/strict";
import test from "node:test";

import {
  selectKpActiveApprovedPlan,
  type KpWorkbenchPlanRevisionNode
} from "../src/editor/semantic-animation-workbench-roadmap-authority.ts";

test("selects the sole active approved KP plan without version matching", () => {
  const selected = selectKpActiveApprovedPlan([
    plan("plan-revision.kp.v41", "superseded", "superseded"),
    plan("plan-revision.other.v99", "active", "approved", "other"),
    plan("plan-revision.kp.v42", "active", "approved")
  ]);

  assert.equal(selected.id, "plan-revision.kp.v42");
  assert.equal(selected.planRevision.revision, 42);
});

test("rejects missing active approved authority", () => {
  assert.throws(
    () =>
      selectKpActiveApprovedPlan([
        plan("plan-revision.kp.v1", "superseded", "superseded")
      ]),
    /found 0: none/
  );
});

test("rejects multiple active approved authorities without choosing one", () => {
  assert.throws(
    () =>
      selectKpActiveApprovedPlan([
        plan("plan-revision.kp.v7", "active", "approved"),
        plan("plan-revision.kp.v8", "active", "approved")
      ]),
    /found 2: plan-revision\.kp\.v7, plan-revision\.kp\.v8/
  );
});

function plan(
  id: string,
  status: string,
  approval: string,
  domain = "kp"
): KpWorkbenchPlanRevisionNode {
  const revision = Number(id.split(".v").at(-1));
  return {
    id,
    kind: "plan-revision",
    title: id,
    status,
    domain,
    planRevision: {
      schemaVersion: "theseus.plan-revision.v2",
      revision,
      objective: "Project one authority.",
      phases: [],
      approval: { status: approval }
    }
  };
}
