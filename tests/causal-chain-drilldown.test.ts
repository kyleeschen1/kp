import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCausalChainDrillDown,
  evaluateKpCausalChainDrillDown
} from "../src/animation/causal-chain-drilldown.ts";
import { createKpCausalChainPlan } from "../src/animation/compressed-causal-chain.ts";

test("Show steps pauses and restores the exact compressed parent frame", () => {
  const parentPlan = plan("parent", "compressed-context");
  const childPlan = plan("child", "full-detail");
  const drillDown = createKpCausalChainDrillDown({
    id: "drilldown.discriminant",
    parentPlan,
    childPlan,
    parentElapsedMs: 90
  });

  assert.equal(drillDown.parentClock.paused, true);
  assert.equal(drillDown.childClock.nested, true);
  assert.deepEqual(drillDown.restore, {
    exact: true,
    elapsedMs: 90,
    progress: 90 / parentPlan.totalDurationMs
  });
  assert.deepEqual(evaluateKpCausalChainDrillDown({
    drillDown,
    parentPlan,
    childPlan
  }), []);
});

test("drill-down rejects a child with different algebra", () => {
  const parentPlan = plan("parent", "compressed-context");
  const childPlan = createKpCausalChainPlan({
    id: "child.drifted",
    presentation: "full-detail",
    actions: [{
      ...actions()[0]!,
      canonicalOperationId: "canonical.divide"
    }]
  });

  assert.throws(() => createKpCausalChainDrillDown({
    id: "drilldown.drifted",
    parentPlan,
    childPlan,
    parentElapsedMs: 0
  }), /identical causal trace/i);
});

test("drill-down refuses invalid modes and out-of-range parent time", () => {
  const full = plan("full", "full-detail");
  const compressed = plan("compressed", "compressed-context");
  assert.throws(() => createKpCausalChainDrillDown({
    id: "drilldown.invalid",
    parentPlan: full,
    childPlan: compressed,
    parentElapsedMs: full.totalDurationMs + 1
  }), /parent must be compressed|child must expose full|pause time/i);
});

test("law evaluator detects a non-exact restore frame", () => {
  const parentPlan = plan("parent", "compressed-context");
  const childPlan = plan("child", "full-detail");
  const drillDown = createKpCausalChainDrillDown({
    id: "drilldown.restore",
    parentPlan,
    childPlan,
    parentElapsedMs: 100
  });

  assert.deepEqual(evaluateKpCausalChainDrillDown({
    drillDown: {
      ...drillDown,
      restore: { ...drillDown.restore, elapsedMs: 101 }
    },
    parentPlan,
    childPlan
  }).map(({ code }) => code), ["drilldown.restore-mismatch"]);
});

function plan(
  id: string,
  presentation: "compressed-context" | "full-detail"
) {
  return createKpCausalChainPlan({
    id,
    presentation,
    actions: actions()
  });
}

function actions() {
  return [{
    id: "operation.power",
    semanticRank: 0,
    canonicalOperationId: "canonical.power",
    dependsOnActionIds: [],
    fullDurationMs: 500,
    minimumVisibleDurationMs: 160
  }];
}
