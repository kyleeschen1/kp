import assert from "node:assert/strict";
import test from "node:test";

import {
  kpRealGlyphCompositorExperimentLedger,
  validateKpRealGlyphCompositorExperimentLedger
} from "../src/animation/real-katex-glyph-compositor-experiment.ts";

test("real-glyph experiment freezes the failed overlay baseline", () => {
  assert.deepEqual(
    kpRealGlyphCompositorExperimentLedger.baselineFailureCodes,
    [
      "whole-equation-crossfade",
      "approximate-text-overlay",
      "mid-flight-character-substitution",
      "unregistered-native-handoff"
    ]
  );
  assert.equal(
    kpRealGlyphCompositorExperimentLedger.currentRenderer,
    "approximate-text-overlay"
  );
});

test("real-glyph acceptance and complexity budgets are fixed before implementation", () => {
  const ledger = kpRealGlyphCompositorExperimentLedger;
  assert.equal(ledger.exemplarAcceptance.length, 6);
  assert.equal(ledger.maxProductionModules, 4);
  assert.equal(ledger.maxLifecyclePrimitives, 6);
  assert.equal(ledger.nativeHandoffTolerancePx, 1);
  assert.deepEqual(validateKpRealGlyphCompositorExperimentLedger(ledger), []);
});
