import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpAnimationStaticCost,
  estimateKpAnimationStaticCostForTier
} from "../src/animation/static-cost-model.ts";

test("low-cost animation plans retain full surface quality", () => {
  const result = evaluateKpAnimationStaticCost({
    tokenCount: 30,
    simultaneousMovingGroupCount: 2,
    fragmentCount: 20,
    shadowLayerCount: 1,
    threeDLayerCount: 0
  });
  assert.equal(result.status, "accepted");
  assert.equal(result.recommendedTier, "full");
  assert.deepEqual(result.diagnostics, []);
});

test("surface-rich plans receive an actionable quality recommendation", () => {
  const result = evaluateKpAnimationStaticCost({
    tokenCount: 50,
    simultaneousMovingGroupCount: 4,
    fragmentCount: 80,
    shadowLayerCount: 2,
    threeDLayerCount: 1
  });
  assert.equal(result.status, "accepted");
  assert.equal(result.recommendedTier, "balanced");
  assert.equal(result.diagnostics[0]?.code, "cost.quality-downgrade");
  assert.equal(result.diagnostics[0]?.action, "use-recommended-tier");
});

test("quality reduces only surface categories, not tokens or moving groups", () => {
  const cost = {
    tokenCount: 50,
    simultaneousMovingGroupCount: 4,
    fragmentCount: 80,
    shadowLayerCount: 2,
    threeDLayerCount: 1
  };
  const full = estimateKpAnimationStaticCostForTier({ cost, tier: "full" });
  const efficient = estimateKpAnimationStaticCostForTier({
    cost,
    tier: "efficient"
  });
  assert.equal(efficient.breakdown.tokens, full.breakdown.tokens);
  assert.equal(
    efficient.breakdown.simultaneousGroups,
    full.breakdown.simultaneousGroups
  );
  assert.ok(efficient.breakdown.fragments < full.breakdown.fragments);
  assert.ok(efficient.breakdown.shadows < full.breakdown.shadows);
  assert.ok(efficient.breakdown.threeD < full.breakdown.threeD);
});

test("over-budget plans request explicit pedagogical compression", () => {
  const result = evaluateKpAnimationStaticCost({
    tokenCount: 200,
    simultaneousMovingGroupCount: 16,
    fragmentCount: 400,
    shadowLayerCount: 12,
    threeDLayerCount: 8
  });
  assert.equal(result.status, "compression-required");
  assert.equal(result.diagnostics[0]?.code, "cost.compression-required");
  assert.equal(
    result.diagnostics[0]?.action,
    "request-pedagogical-compression"
  );
  assert.match(result.diagnostics[0]?.message ?? "", /do not remove semantic steps/i);
});

test("invalid and hard-limit plans are rejected before rendering", () => {
  const invalid = evaluateKpAnimationStaticCost({
    tokenCount: -1,
    simultaneousMovingGroupCount: 1.5,
    fragmentCount: 0,
    shadowLayerCount: 0,
    threeDLayerCount: 0
  });
  assert.equal(invalid.status, "rejected");
  assert.deepEqual(
    invalid.diagnostics.map((diagnostic) => diagnostic.code),
    ["cost.invalid-count", "cost.invalid-count"]
  );

  const excessive = evaluateKpAnimationStaticCost({
    tokenCount: 300,
    simultaneousMovingGroupCount: 1,
    fragmentCount: 0,
    shadowLayerCount: 0,
    threeDLayerCount: 0
  });
  assert.equal(excessive.status, "rejected");
  assert.equal(excessive.diagnostics[0]?.metric, "tokenCount");
  assert.equal(excessive.diagnostics[0]?.action, "reduce-authored-complexity");
});
