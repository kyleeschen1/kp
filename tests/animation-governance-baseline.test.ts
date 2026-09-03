import assert from "node:assert/strict";
import test from "node:test";
import {
  kpAnimationCatalogPackDeclarations
} from "../src/animation/catalog-loader.ts";
import {
  kpAnimationPerformanceTargets
} from "../src/animation/performance-budget.ts";
import {
  inspectKpAnimationGovernanceInferenceRegression,
  kpAnimationGovernanceEpochV2Baseline
} from "../src/architecture/animation-governance-baseline.ts";
import {
  typescriptInferenceBudget
} from "../src/architecture/typescript-inference-budget.ts";
import {
  kpEditorSelectedSurfaceCapabilityDeclarations
} from "../src/editor/selected-surface-capability-declarations.ts";
import {
  kpAnimationLibraryBundleBoundary
} from "../scripts/check-animation-library-bundle-boundary.ts";

test("epoch v2 preserves existing inference and runtime targets", () => {
  assert.equal(
    kpAnimationGovernanceEpochV2Baseline.inference.admissionCeilings,
    typescriptInferenceBudget.ceilings
  );
  assert.equal(
    kpAnimationGovernanceEpochV2Baseline.runtime.productTargets,
    kpAnimationPerformanceTargets
  );
  assert.ok(
    kpAnimationGovernanceEpochV2Baseline.inference.observed.types <=
      typescriptInferenceBudget.ceilings.types
  );
  assert.deepEqual(inspectKpAnimationGovernanceInferenceRegression({
    ...kpAnimationGovernanceEpochV2Baseline.inference.observed
  }), []);
});

test("baseline remains tied to literal lazy-loading declarations", () => {
  assert.equal(
    kpAnimationCatalogPackDeclarations.length,
    kpAnimationGovernanceEpochV2Baseline.lazyLoading
      .catalogPackDeclarationCount
  );
  assert.equal(
    kpEditorSelectedSurfaceCapabilityDeclarations.length,
    kpAnimationGovernanceEpochV2Baseline.lazyLoading
      .selectedCapabilityDeclarationCount
  );
  assert.equal(
    kpAnimationGovernanceEpochV2Baseline.bundle.forbiddenOuterFiles.length,
    0
  );
  assert.equal(
    kpAnimationGovernanceEpochV2Baseline.lazyLoading.initialThreeRequested,
    false
  );
});

test("bundle observations retain headroom without changing ceilings", () => {
  const { observedGzipBytes, ceilingsGzipBytes } =
    kpAnimationGovernanceEpochV2Baseline.bundle;
  assert.deepEqual(ceilingsGzipBytes, {
    outer: kpAnimationLibraryBundleBoundary.outerGzipBytes,
    mainHost: kpAnimationLibraryBundleBoundary.mainHostGzipBytes,
    measuredCatalogueRouteScript:
      kpAnimationLibraryBundleBoundary.measuredCatalogueRouteScriptGzipBytes,
    placeValueIncremental:
      kpAnimationLibraryBundleBoundary.placeValueIncrementalGzipBytes
  });
  assert.ok(observedGzipBytes.outer <= ceilingsGzipBytes.outer);
  assert.ok(observedGzipBytes.mainHost <= ceilingsGzipBytes.mainHost);
  assert.ok(
    observedGzipBytes.measuredCatalogueRouteScript <=
      ceilingsGzipBytes.measuredCatalogueRouteScript
  );
  assert.ok(
    observedGzipBytes.placeValueIncremental <=
      ceilingsGzipBytes.placeValueIncremental
  );
});
