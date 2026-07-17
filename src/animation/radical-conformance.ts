export interface KpRadicalConformanceBaseline {
  readonly id: string;
  readonly approvedExemplarId: string;
  readonly animationId: string;
  readonly requiredSourceFragmentCount: number;
  readonly requiredTargetFragmentCount: number;
  readonly requiredSourcePathFamily: string;
  readonly requiredTargetPathFamilies: readonly string[];
  readonly minimumTokenScale: number;
  readonly maximumStageOverflowPx: number;
  readonly maximumFontSizeDeltaPx: number;
  readonly maximumReversePositionDeltaPx: number;
  readonly maximumReverseOpacityDelta: number;
  readonly maximumNativeResidualPx: number;
}

export interface KpRadicalConformanceObservation {
  readonly sourceFragmentCount: number;
  readonly distinctSourceSlotCount: number;
  readonly targetFragmentCount: number;
  readonly targetsVisibleBeforeReadiness: number;
  readonly sourcePathFamilies: readonly string[];
  readonly targetPathFamilies: readonly string[];
  readonly minimumTokenScale: number;
  readonly wholeStructureTransforms: readonly string[];
  readonly maximumStageOverflowPx: number;
  readonly materialFontFamily: string;
  readonly nativeFontFamily: string;
  readonly materialFontSizePx: number;
  readonly nativeFontSizePx: number;
  readonly maximumReversePositionDeltaPx: number;
  readonly maximumReverseOpacityDelta: number;
  readonly nativeGeometryReady: boolean;
  readonly nativeSettlementProgress: number;
  readonly maximumNativeResidualPx: number;
  readonly remainingMaterialFragmentCount: number;
}

export interface KpRadicalConformanceViolation {
  readonly lawId:
    | "radical.grouping.source-count"
    | "radical.grouping.distinct-slots"
    | "radical.grouping.target-count"
    | "radical.readiness.target-birth"
    | "radical.motion.source-path"
    | "radical.motion.target-paths"
    | "radical.motion.token-scale-floor"
    | "radical.motion.no-structure-transform"
    | "radical.clipping.stage-containment"
    | "radical.typography.katex-family"
    | "radical.typography.font-size"
    | "radical.rewind.position"
    | "radical.rewind.opacity"
    | "radical.settlement.geometry-ready"
    | "radical.settlement.progress"
    | "radical.settlement.native-residual"
    | "radical.settlement.material-disposal";
  readonly actual: string | number | boolean;
  readonly expected: string | number | boolean;
}

export const kpNormativeRadicalConformanceBaseline:
  KpRadicalConformanceBaseline = {
    id: "baseline.radical.material-junction.dashboard-v1",
    approvedExemplarId: "exemplar.radical-rewrite.dashboard-v0",
    animationId: "animation.generated.radical.square-root-as-power",
    requiredSourceFragmentCount: 3,
    requiredTargetFragmentCount: 2,
    requiredSourcePathFamily: "opposite-corner",
    requiredTargetPathFamilies: [
      "diagonal-arc-above",
      "diagonal-arc-below"
    ],
    minimumTokenScale: 0.78,
    maximumStageOverflowPx: 0.5,
    maximumFontSizeDeltaPx: 0.01,
    maximumReversePositionDeltaPx: 0.75,
    maximumReverseOpacityDelta: 0.01,
    maximumNativeResidualPx: 0.25
  };

export function evaluateKpRadicalConformance(input: {
  readonly observation: KpRadicalConformanceObservation;
  readonly baseline?: KpRadicalConformanceBaseline | undefined;
}): readonly KpRadicalConformanceViolation[] {
  const baseline = input.baseline ?? kpNormativeRadicalConformanceBaseline;
  const observation = input.observation;
  const violations: KpRadicalConformanceViolation[] = [];
  exact(violations, "radical.grouping.source-count", observation.sourceFragmentCount, baseline.requiredSourceFragmentCount);
  exact(violations, "radical.grouping.distinct-slots", observation.distinctSourceSlotCount, baseline.requiredSourceFragmentCount);
  exact(violations, "radical.grouping.target-count", observation.targetFragmentCount, baseline.requiredTargetFragmentCount);
  maximum(violations, "radical.readiness.target-birth", observation.targetsVisibleBeforeReadiness, 0);
  exact(
    violations,
    "radical.motion.source-path",
    [...new Set(observation.sourcePathFamilies)].sort().join(","),
    baseline.requiredSourcePathFamily
  );
  exact(
    violations,
    "radical.motion.target-paths",
    [...new Set(observation.targetPathFamilies)].sort().join(","),
    [...baseline.requiredTargetPathFamilies].sort().join(",")
  );
  minimum(violations, "radical.motion.token-scale-floor", observation.minimumTokenScale, baseline.minimumTokenScale);
  exact(
    violations,
    "radical.motion.no-structure-transform",
    observation.wholeStructureTransforms.every((value) => value === "none"),
    true
  );
  maximum(violations, "radical.clipping.stage-containment", observation.maximumStageOverflowPx, baseline.maximumStageOverflowPx);
  exact(
    violations,
    "radical.typography.katex-family",
    observation.materialFontFamily === observation.nativeFontFamily &&
      observation.nativeFontFamily.includes("KaTeX"),
    true
  );
  maximum(
    violations,
    "radical.typography.font-size",
    Math.abs(observation.materialFontSizePx - observation.nativeFontSizePx),
    baseline.maximumFontSizeDeltaPx
  );
  maximum(violations, "radical.rewind.position", observation.maximumReversePositionDeltaPx, baseline.maximumReversePositionDeltaPx);
  maximum(violations, "radical.rewind.opacity", observation.maximumReverseOpacityDelta, baseline.maximumReverseOpacityDelta);
  exact(violations, "radical.settlement.geometry-ready", observation.nativeGeometryReady, true);
  exact(violations, "radical.settlement.progress", observation.nativeSettlementProgress, 1);
  maximum(violations, "radical.settlement.native-residual", observation.maximumNativeResidualPx, baseline.maximumNativeResidualPx);
  exact(violations, "radical.settlement.material-disposal", observation.remainingMaterialFragmentCount, 0);
  return violations;
}

function exact(
  violations: KpRadicalConformanceViolation[],
  lawId: KpRadicalConformanceViolation["lawId"],
  actual: string | number | boolean,
  expected: string | number | boolean
): void {
  if (actual !== expected) violations.push({ lawId, actual, expected });
}

function maximum(
  violations: KpRadicalConformanceViolation[],
  lawId: KpRadicalConformanceViolation["lawId"],
  actual: number,
  expected: number
): void {
  if (!Number.isFinite(actual) || actual > expected) {
    violations.push({ lawId, actual, expected });
  }
}

function minimum(
  violations: KpRadicalConformanceViolation[],
  lawId: KpRadicalConformanceViolation["lawId"],
  actual: number,
  expected: number
): void {
  if (!Number.isFinite(actual) || actual < expected) {
    violations.push({ lawId, actual, expected });
  }
}
