import assert from "node:assert/strict";
import test from "node:test";

import {
  assertKpCanonicalReaderPromotionCost,
  evaluateKpCanonicalReaderPromotionCost,
  kpCanonicalReaderPromotionProtectedCoreFiles,
  type KpCanonicalReaderPromotionCostEvidence
} from "../src/architecture/canonical-reader-promotion-cost.ts";

test("post-kit promotion accepts only content descriptor and verification wiring", () => {
  const evidence = costEvidence({
    changedFiles: [
      "content/lessons/unit-exponent.md",
      "src/reader/compiler/unit-exponent-equation-lesson.ts",
      "src/reader/compiler/unit-exponent-preservation-manifest.ts",
      "src/reader/compiler/public-api.ts",
      "src/reader/compiler/reader-route-manifest.ts",
      "src/reader/app/equation-lesson-descriptor.ts",
      "src/reader/app/equation-lesson-descriptors/unit-exponent.ts",
      "src/rendering/unit-exponent-selector-annotated-latex.ts",
      "tests/unit-exponent-reader.test.ts",
      "tests/unit-exponent-reader.browser.spec.ts",
      "scripts/capture-unit-exponent.ts",
      "docs/project/reviews/unit-exponent-proof.md",
      "docs/theseus/events/example.jsonl",
      "package.json"
    ]
  });
  assert.deepEqual(evaluateKpCanonicalReaderPromotionCost(evidence), []);
  assert.doesNotThrow(() => assertKpCanonicalReaderPromotionCost(evidence));
});

test("post-kit promotion rejects every protected compositor and scheduler core", () => {
  const issues = evaluateKpCanonicalReaderPromotionCost(costEvidence({
    changedFiles: kpCanonicalReaderPromotionProtectedCoreFiles
  }));
  assert.equal(
    issues.filter(({ kind }) => kind === "compositor-core-change").length,
    kpCanonicalReaderPromotionProtectedCoreFiles.length
  );
});

test("post-kit promotion rejects lifecycle scheduler geometry and runtime growth", () => {
  const issues = evaluateKpCanonicalReaderPromotionCost(costEvidence({
    addedLifecycleCategories: ["radical-fold"],
    addedSchedulerCategories: ["root-corner-route"],
    notationSpecificGeometryFiles: ["src/rendering/radical-offsets.ts"],
    addedRuntimeArtifactIds: ["runtime.radical-reader-v2"]
  }));
  assert.deepEqual(issues.map(({ kind }) => kind), [
    "lifecycle-category",
    "scheduler-category",
    "notation-specific-geometry",
    "runtime-artifact"
  ]);
  assert.throws(
    () => assertKpCanonicalReaderPromotionCost(costEvidence({
      addedRuntimeArtifactIds: ["runtime.radical-reader-v2"]
    })),
    /runtime-artifact:runtime\.radical-reader-v2/
  );
});

test("post-kit promotion rejects unclassified production changes", () => {
  const issues = evaluateKpCanonicalReaderPromotionCost(costEvidence({
    changedFiles: [
      "src/animation/radical-special-case.ts",
      "src/editor/radical-reader.ts"
    ]
  }));
  assert.deepEqual(issues.map(({ kind }) => kind), [
    "unclassified-change",
    "unclassified-change"
  ]);
});

function costEvidence(
  overrides: Partial<KpCanonicalReaderPromotionCostEvidence>
): KpCanonicalReaderPromotionCostEvidence {
  return {
    schemaVersion: "kp.canonical-reader-promotion-cost.v1",
    promotionId: "promotion.unit-exponent.dry-run",
    changedFiles: [],
    addedLifecycleCategories: [],
    addedSchedulerCategories: [],
    notationSpecificGeometryFiles: [],
    addedRuntimeArtifactIds: [],
    ...overrides
  };
}
