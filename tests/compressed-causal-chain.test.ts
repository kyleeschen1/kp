import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCausalChainPlan,
  evaluateKpCausalChainPlan
} from "../src/animation/compressed-causal-chain.ts";

test("compressed context keeps every distinct operation visible and ordered", () => {
  const plan = createKpCausalChainPlan({
    id: "chain.discriminant",
    presentation: "compressed-context",
    actions: actions(),
    compressedDurationMsByActionId: {
      power: 180,
      product: 160,
      subtract: 180
    }
  });

  assert.deepEqual(
    plan.segments.map(({ actionId, disclosure }) => [actionId, disclosure]),
    [
      ["power", "compressed-causal-operation"],
      ["product", "compressed-causal-operation"],
      ["subtract", "compressed-causal-operation"]
    ]
  );
  assert.equal(plan.totalDurationMs, 520);
  assert.deepEqual(evaluateKpCausalChainPlan(plan), []);
});

test("full detail uses the same actions and their complete durations", () => {
  const plan = createKpCausalChainPlan({
    id: "chain.discriminant.full",
    presentation: "full-detail",
    actions: actions()
  });

  assert.deepEqual(
    plan.segments.map(({ actionId, durationMs }) => [actionId, durationMs]),
    [
      ["power", 500],
      ["product", 480],
      ["subtract", 520]
    ]
  );
});

test("compression cannot hide an operation below its visible minimum", () => {
  assert.throws(() => createKpCausalChainPlan({
    id: "chain.hidden",
    presentation: "compressed-context",
    actions: actions(),
    compressedDurationMsByActionId: {
      power: 1
    }
  }), /visible minimum/i);
});

test("causal actions cannot run before their dependencies", () => {
  const reordered = [actions()[1]!, actions()[0]!, actions()[2]!].map(
    (action, semanticRank) => ({ ...action, semanticRank })
  );
  assert.throws(() => createKpCausalChainPlan({
    id: "chain.reordered",
    presentation: "compressed-context",
    actions: reordered
  }), /before it is available/i);
});

test("law evaluator rejects grouped endpoint replacement", () => {
  const plan = createKpCausalChainPlan({
    id: "chain.valid",
    presentation: "compressed-context",
    actions: actions()
  });
  const grouped = {
    ...plan,
    segments: [{
      ...plan.segments[0]!,
      id: "chain.valid.grouped",
      actionId: "subtract",
      durationMs: plan.totalDurationMs,
      endMs: plan.totalDurationMs
    }]
  };

  assert.deepEqual(
    evaluateKpCausalChainPlan(grouped).map(({ code }) => code),
    [
      "causal-chain.missing-action",
      "causal-chain.segment-order"
    ]
  );
});

function actions() {
  return [
    {
      id: "power",
      semanticRank: 0,
      canonicalOperationId: "canonical.power",
      dependsOnActionIds: [],
      fullDurationMs: 500,
      minimumVisibleDurationMs: 160
    },
    {
      id: "product",
      semanticRank: 1,
      canonicalOperationId: "canonical.multiply",
      dependsOnActionIds: ["power"],
      fullDurationMs: 480,
      minimumVisibleDurationMs: 140
    },
    {
      id: "subtract",
      semanticRank: 2,
      canonicalOperationId: "canonical.subtract",
      dependsOnActionIds: ["power", "product"],
      fullDurationMs: 520,
      minimumVisibleDurationMs: 170
    }
  ];
}
