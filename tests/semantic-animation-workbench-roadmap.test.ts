import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpWorkbenchRoadmap
} from "../src/editor/semantic-animation-workbench-roadmap.ts";
import type {
  KpWorkbenchPlanRevisionNode
} from "../src/editor/semantic-animation-workbench-roadmap-authority.ts";

test("projects phase order and roadmap metadata without local lifecycle state", () => {
  const roadmap = projectKpWorkbenchRoadmap(plan());

  assert.deepEqual(roadmap, {
    planId: "plan-revision.kp.v42",
    planRevision: 42,
    planTitle: "Roadmap v42",
    objective: "Keep one roadmap authority.",
    rows: [
      {
        id: "platform",
        order: 1,
        title: "Platform",
        objective: "Stabilize the platform.",
        topic: "Platform",
        horizon: "now",
        state: "active",
        architectureBenefit: "One control plane.",
        rationale: "Foundation first.",
        canonicalExemplar: "Workbench"
      },
      {
        id: "future-math",
        order: 2,
        title: "Future math",
        objective: "Retain future coverage.",
        horizon: "later",
        state: "planned"
      }
    ]
  });
  assert.equal(Object.isFrozen(roadmap), true);
  assert.equal(Object.isFrozen(roadmap.rows), true);
  assert.equal(Object.isFrozen(roadmap.rows[0]), true);
  assert.equal("setState" in roadmap.rows[0]!, false);
  assert.equal("execution" in roadmap.rows[0]!, false);
});

test("projection is deterministic and leaves its source unchanged", () => {
  const source = plan();
  const before = structuredClone(source);

  assert.deepEqual(
    projectKpWorkbenchRoadmap(source),
    projectKpWorkbenchRoadmap(source)
  );
  assert.deepEqual(source, before);
});

function plan(): KpWorkbenchPlanRevisionNode {
  return {
    id: "plan-revision.kp.v42",
    kind: "plan-revision",
    title: "Roadmap v42",
    status: "active",
    domain: "kp",
    planRevision: {
      schemaVersion: "theseus.plan-revision.v2",
      revision: 42,
      objective: "Keep one roadmap authority.",
      approval: { status: "approved" },
      phases: [
        {
          id: "platform",
          title: "Platform",
          objective: "Stabilize the platform.",
          topic: "Platform",
          horizon: "now",
          status: "active",
          architectureBenefit: "One control plane.",
          rationale: "Foundation first.",
          canonicalExemplar: "Workbench"
        },
        {
          id: "future-math",
          title: "Future math",
          objective: "Retain future coverage.",
          horizon: "later",
          status: "planned"
        }
      ]
    }
  };
}
