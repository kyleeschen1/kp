import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexConformanceCoverageManifest,
  KP_NATIVE_KATEX_CONFORMANCE_MANIFEST_SCHEMA_VERSION,
  serializeKpNativeKatexConformanceCoverageManifest
} from "./support/native-katex-compositor-conformance-manifest.ts";
import {
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

function makeManifest() {
  return createKpNativeKatexConformanceCoverageManifest(
    planKpNativeKatexPairwiseCoverage({
      factors,
      overrides: [override],
      maximumScenarios: 24
    })
  );
}

test("emits a stable, JSON-safe explanation of bounded coverage", () => {
  const first = makeManifest();
  const second = makeManifest();
  const serialized = serializeKpNativeKatexConformanceCoverageManifest(first);

  assert.deepEqual(first, second);
  assert.equal(serialized, serializeKpNativeKatexConformanceCoverageManifest(second));
  assert.deepEqual(JSON.parse(serialized), first);
  assert.equal(first.schemaVersion, KP_NATIVE_KATEX_CONFORMANCE_MANIFEST_SCHEMA_VERSION);
  assert.equal(first.coverageComplete, true);
  assert.equal(first.counts.factors, factors.length);
  assert.equal(first.counts.scenarios, first.scenarios.length);
  assert.equal(first.counts.requiredPairs, first.counts.coveredPairs);
  assert.equal(first.counts.threeWayOverrides, 1);
});

test("explains both risk overrides and greedy pairwise selections", () => {
  const manifest = makeManifest();
  const overrideScenario = manifest.scenarios.find((scenario) =>
    scenario.overrideIds.includes(override.id)
  );
  const pairwiseScenario = manifest.scenarios.find((scenario) =>
    scenario.inclusionKind === "pairwise"
  );

  assert.ok(overrideScenario);
  assert.match(overrideScenario.explanation, /Required by three-way risk override/u);
  assert.match(overrideScenario.explanation, /first covers \d+ pair requirements?\./u);
  assert.ok(pairwiseScenario);
  assert.match(pairwiseScenario.explanation, /Selected to first cover/u);
  assert.ok(pairwiseScenario.newlyCoveredPairKeys.length > 0);
});
