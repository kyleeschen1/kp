import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpRadicalConformance,
  kpNormativeRadicalConformanceBaseline,
  type KpRadicalConformanceObservation
} from "../src/animation/radical-conformance.ts";

test("normative radical baseline names its approved dashboard exemplar", () => {
  assert.equal(
    kpNormativeRadicalConformanceBaseline.approvedExemplarId,
    "exemplar.radical-rewrite.dashboard-v0"
  );
  assert.deepEqual(
    kpNormativeRadicalConformanceBaseline.requiredTargetPathFamilies,
    ["diagonal-arc-above", "diagonal-arc-below"]
  );
});

test("radical conformance accepts grouped, unclipped, type-stable native settlement", () => {
  assert.deepEqual(evaluateKpRadicalConformance({
    observation: passingObservation()
  }), []);
});

test("radical conformance reports each visible discontinuity class", () => {
  const violations = evaluateKpRadicalConformance({
    observation: {
      ...passingObservation(),
      distinctSourceSlotCount: 1,
      targetsVisibleBeforeReadiness: 1,
      targetPathFamilies: ["direct"],
      minimumTokenScale: 0.5,
      wholeStructureTransforms: ["matrix(0.8, 0, 0, 0.8, 0, 0)"],
      maximumStageOverflowPx: 4,
      materialFontFamily: "serif",
      maximumReversePositionDeltaPx: 3,
      nativeGeometryReady: false,
      nativeSettlementProgress: 0.5,
      remainingMaterialFragmentCount: 2
    }
  });
  assert.deepEqual(new Set(violations.map((violation) => violation.lawId)), new Set([
    "radical.grouping.distinct-slots",
    "radical.readiness.target-birth",
    "radical.motion.target-paths",
    "radical.motion.token-scale-floor",
    "radical.motion.no-structure-transform",
    "radical.clipping.stage-containment",
    "radical.typography.katex-family",
    "radical.rewind.position",
    "radical.settlement.geometry-ready",
    "radical.settlement.progress",
    "radical.settlement.material-disposal"
  ]));
});

function passingObservation(): KpRadicalConformanceObservation {
  return {
    sourceFragmentCount: 3,
    distinctSourceSlotCount: 3,
    targetFragmentCount: 2,
    targetsVisibleBeforeReadiness: 0,
    sourcePathFamilies: ["opposite-corner"],
    targetPathFamilies: ["diagonal-arc-below", "diagonal-arc-above"],
    minimumTokenScale: 0.82,
    wholeStructureTransforms: ["none", "none"],
    maximumStageOverflowPx: 0,
    materialFontFamily: "KaTeX_Main",
    nativeFontFamily: "KaTeX_Main",
    materialFontSizePx: 32,
    nativeFontSizePx: 32,
    maximumReversePositionDeltaPx: 0.2,
    maximumReverseOpacityDelta: 0,
    nativeGeometryReady: true,
    nativeSettlementProgress: 1,
    maximumNativeResidualPx: 0.1,
    remainingMaterialFragmentCount: 0
  };
}
