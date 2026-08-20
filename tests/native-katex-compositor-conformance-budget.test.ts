import assert from "node:assert/strict";
import test from "node:test";

import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";

test("freezes bounded canary, promotion, and browser scenario counts", () => {
  const { hard } = kpNativeKatexCompositorConformanceBudget;

  assert.equal(hard.fastCanaryMaximumScenarios, 24);
  assert.equal(hard.promotionMaximumScenarios, 96);
  assert.equal(hard.crossBrowserMaximumScenariosPerEngine, 12);
  assert.equal(hard.maximumWorkers, 1);
  assert.ok(
    hard.fastCanaryMaximumScenarios < hard.promotionMaximumScenarios
  );
});

test("uses five semantic seam samples without routine screenshots or fuzz", () => {
  const budget = kpNativeKatexCompositorConformanceBudget;

  assert.equal(
    budget.sampleSlots.length,
    budget.hard.maximumSamplesPerTransition
  );
  assert.deepEqual(budget.sampleSlots, [
    "source-native",
    "source-material-seam",
    "material-midpoint",
    "material-target-seam",
    "target-native"
  ]);
  assert.equal(budget.hard.routineScreenshotCount, 0);
  assert.equal(budget.hard.defaultUnseededFuzzCases, 0);
  assert.equal(budget.policy.screenshotsRequireExplicitReviewMode, true);
});

test("requires one reusable browser lane and structured diagnostics", () => {
  const { hard, policy } = kpNativeKatexCompositorConformanceBudget;

  assert.equal(hard.maximumPagesPerProfile, 1);
  assert.equal(policy.reuseServer, true);
  assert.equal(policy.reuseBrowser, true);
  assert.equal(policy.reusePageWithinProfile, true);
  assert.equal(policy.failureDiagnosticsAreStructuredData, true);
  assert.equal(policy.generatedCoverageIsDeterministic, true);
});
