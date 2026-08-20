import assert from "node:assert/strict";
import test from "node:test";

import {
  enumerateKpConformancePairKeys,
  planKpNativeKatexPairwiseCoverage,
  type KpConformanceCoverageFactor
} from "./support/native-katex-compositor-pairwise-coverage.ts";

const factors = Object.freeze([
  { id: "shape", values: ["digit", "italic"] },
  { id: "context", values: ["same", "longer"] },
  { id: "topology", values: ["one-to-one", "many-to-one"] },
  { id: "lifecycle", values: ["seek", "reverse"] },
  { id: "mode", values: ["dark", "light"] }
] satisfies readonly KpConformanceCoverageFactor[]);

const override = Object.freeze({
  id: "risk.italic-longer-reverse",
  riskFactorIds: ["shape", "context", "lifecycle"] as const,
  assignments: Object.freeze({
    shape: "italic",
    context: "longer",
    topology: "one-to-one",
    lifecycle: "reverse",
    mode: "dark"
  })
});

test("deterministically covers every factor pair within the canary budget", () => {
  const first = planKpNativeKatexPairwiseCoverage({
    factors,
    overrides: [override],
    maximumScenarios: 24
  });
  const second = planKpNativeKatexPairwiseCoverage({
    factors,
    overrides: [override],
    maximumScenarios: 24
  });

  assert.deepEqual(first, second);
  assert.deepEqual(first.coveredPairKeys, enumerateKpConformancePairKeys(factors));
  assert.ok(first.scenarios.length <= 24);
  assert.ok(first.scenarios.length < 2 ** factors.length);
});

test("always includes and explains a declared three-way risk override", () => {
  const plan = planKpNativeKatexPairwiseCoverage({
    factors,
    overrides: [override],
    maximumScenarios: 24
  });
  const selected = plan.scenarios.find((scenario) =>
    scenario.inclusion.overrideIds.includes(override.id)
  );

  assert.ok(selected);
  assert.equal(selected.inclusion.kind, "three-way-override");
  assert.deepEqual(selected.assignments, override.assignments);
  assert.deepEqual(plan.overrideIds, [override.id]);
});

test("fails closed when the approved scenario budget cannot cover all pairs", () => {
  assert.throws(() => planKpNativeKatexPairwiseCoverage({
    factors,
    maximumScenarios: 1
  }), /pair requirements remain/u);
});

test("rejects malformed factors and three-way overrides", () => {
  assert.throws(() => planKpNativeKatexPairwiseCoverage({
    factors: [{ id: "only", values: ["one"] }],
    maximumScenarios: 24
  }), /at least two factors/u);
  assert.throws(() => planKpNativeKatexPairwiseCoverage({
    factors: [
      { id: "duplicate", values: ["one"] },
      { id: "duplicate", values: ["two"] }
    ],
    maximumScenarios: 24
  }), /factor IDs must be unique/u);
  assert.throws(() => planKpNativeKatexPairwiseCoverage({
    factors,
    overrides: [{
      ...override,
      riskFactorIds: ["shape", "shape", "mode"]
    }],
    maximumScenarios: 24
  }), /three distinct risk factors/u);
  assert.throws(() => planKpNativeKatexPairwiseCoverage({
    factors,
    overrides: [{
      ...override,
      assignments: { ...override.assignments, shape: "unknown" }
    }],
    maximumScenarios: 24
  }), /unknown shape value/u);
});
