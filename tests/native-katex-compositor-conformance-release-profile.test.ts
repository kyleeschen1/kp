import assert from "node:assert/strict";
import test from "node:test";

import {
  kpNativeKatexConformanceReleaseProfile
} from "./fixtures/native-katex-compositor-conformance-release.ts";
import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";

test("bounds one representative lifecycle cohort for every supported engine", () => {
  assert.deepEqual(kpNativeKatexConformanceReleaseProfile.engines, [
    "chromium",
    "firefox",
    "webkit"
  ]);
  assert.deepEqual(
    kpNativeKatexConformanceReleaseProfile.lifecycleScenarios.map(
      ({ action }) => action
    ),
    [
      "direct-seek",
      "reverse",
      "interruption",
      "font-invalidation",
      "viewport-resize",
      "dpr-change",
      "theme-change",
      "reduced-motion"
    ]
  );
  assert.equal(
    kpNativeKatexConformanceReleaseProfile.scenariosPerEngine,
    kpNativeKatexConformanceReleaseProfile.baselineTraceScenarios +
      kpNativeKatexConformanceReleaseProfile.lifecycleScenarios.length
  );
  assert.ok(
    kpNativeKatexConformanceReleaseProfile.scenariosPerEngine <=
      kpNativeKatexCompositorConformanceBudget.hard
        .crossBrowserMaximumScenariosPerEngine
  );
});

test("requires one reusable page and structured diagnostics without screenshots", () => {
  assert.equal(kpNativeKatexConformanceReleaseProfile.pagesPerEngine, 1);
  assert.equal(kpNativeKatexConformanceReleaseProfile.workers, 1);
  assert.equal(kpNativeKatexConformanceReleaseProfile.routineScreenshots, 0);
  assert.equal(kpNativeKatexConformanceReleaseProfile.reusePage, true);
  assert.equal(
    kpNativeKatexConformanceReleaseProfile.failureDiagnostics,
    "structured-data"
  );
});
