import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationAsset,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  kpRealGlyphCompositorExperimentLedger,
  validateKpRealGlyphCompositorExperimentLedger
} from "../src/animation/real-katex-glyph-compositor-experiment.ts";
import {
  decideKpNativeKatexCompositorDisposition
} from "../src/rendering/native-katex-glyph-compositor.ts";

test("real-glyph experiment retains the failed baseline after retiring its overlay", () => {
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
    "native-katex-fragment-compositor"
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

test("renderer-session fragment state cannot survive animation construction", () => {
  const source = createLinearSolveAnimationAsset();
  const forgedInput = {
    ...source,
    nativeFragmentObservations: [{ domHandle: {}, glyphRect: { x: 1 } }],
    keyframes: [{ opacity: 0.5 }],
    backendPlan: { kind: "glyph-compositor" }
  } as unknown as Parameters<typeof createKpAnimationAsset>[0];
  const reconstructed = createKpAnimationAsset(forgedInput);
  const serialized = JSON.stringify(reconstructed);

  assert.deepEqual(validateKpAnimationAsset(reconstructed), []);
  for (
    const field of
    kpRealGlyphCompositorExperimentLedger.durableForbiddenFields
  ) {
    assert.equal(field in reconstructed, false);
    assert.equal(serialized.includes(field), false);
  }
});

test("ambiguity and blocked geometry choose inspectable checkpoint settlement", () => {
  const ambiguous = decideKpNativeKatexCompositorDisposition({
    ambiguities: [
      { lineageGroupId: "lineage.ambiguous-x" },
      { lineageGroupId: "lineage.ambiguous-x" }
    ],
    motions: [{ matchId: "motion.direct", status: "direct" }]
  });
  const blocked = decideKpNativeKatexCompositorDisposition({
    ambiguities: [],
    motions: [
      { matchId: "motion.clear", status: "clearance-route" },
      { matchId: "motion.blocked", status: "settle" }
    ]
  });
  const clear = decideKpNativeKatexCompositorDisposition({
    ambiguities: [],
    motions: [{ matchId: "motion.clear", status: "clearance-route" }]
  });

  assert.deepEqual(ambiguous, {
    kind: "native-katex-compositor-disposition",
    lifecycle: "renderer-session",
    mode: "checkpoint-settlement",
    reason: "semantic-ambiguity",
    affectedIds: ["lineage.ambiguous-x"]
  });
  assert.equal(blocked.mode, "checkpoint-settlement");
  assert.equal(blocked.reason, "blocked-geometry");
  assert.deepEqual(blocked.affectedIds, ["motion.blocked"]);
  assert.equal(clear.mode, "motion");
  assert.equal(clear.reason, "clear");
});
