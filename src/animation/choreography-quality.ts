export interface KpChoreographyQualityRanges {
  readonly minimumFocusReadinessBeforeAct: number;
  readonly minimumExplanatorySalience: number;
  readonly minimumCauseLegibilityBeforeElimination: number;
  readonly maximumResidualTransform: number;
  readonly maximumResidualDeformation: number;
  readonly maximumStableCheckpointSpeed: number;
  readonly minimumMaterialContinuity: number;
}

export interface KpChoreographyQualitySample {
  readonly progress: number;
  readonly focusReadiness: number;
  readonly explanatorySalience: number;
  readonly reflowProgress: number;
  readonly actProgress: number;
  readonly governedReflowActOverlap: boolean;
  readonly eliminationProgress: number;
  readonly causeLegibility: number;
  readonly groupSeparation: number;
  readonly maximumGroupSeparation: number;
  readonly residualTransform: number;
  readonly residualDeformation: number;
  readonly speed: number;
  readonly materialContinuity: number;
  readonly stableCheckpoint: boolean;
}

export interface KpChoreographyQualityDiagnostic {
  readonly code:
    | "choreography.focus-lead"
    | "choreography.attention-gap"
    | "choreography.premature-act"
    | "choreography.premature-elimination"
    | "choreography.cohesion"
    | "choreography.residual-transform"
    | "choreography.residual-deformation"
    | "choreography.endpoint-stillness"
    | "choreography.material-continuity";
  readonly severity: "error" | "warning";
  readonly progress: number;
  readonly measured: number;
  readonly threshold: number;
  readonly message: string;
}

export interface KpChoreographyQualityReport {
  readonly kind: "choreography-quality-report";
  readonly passedAutomatedGates: boolean;
  readonly diagnostics: readonly KpChoreographyQualityDiagnostic[];
  readonly ranges: KpChoreographyQualityRanges;
  readonly calibrationSource: "dashboard-exemplar-baseline-v0";
  readonly subjectiveReviewRequired: true;
  readonly humanReviewRubric: readonly [
    "causal-legibility",
    "semantic-object-constancy",
    "attention-continuity",
    "organic-coherence",
    "typographic-integrity",
    "pacing-and-dwell",
    "visual-restraint",
    "rewind-comprehension",
    "reduced-motion-equivalence"
  ];
}

export const defaultKpChoreographyQualityRanges:
  KpChoreographyQualityRanges = {
    minimumFocusReadinessBeforeAct: 0.6,
    minimumExplanatorySalience: 0.1,
    minimumCauseLegibilityBeforeElimination: 0.6,
    maximumResidualTransform: 0.001,
    maximumResidualDeformation: 0.001,
    maximumStableCheckpointSpeed: 0.001,
    minimumMaterialContinuity: 0.45
  };

export function evaluateKpChoreographyQuality(input: {
  readonly samples: readonly KpChoreographyQualitySample[];
  readonly ranges?: Partial<KpChoreographyQualityRanges> | undefined;
}): KpChoreographyQualityReport {
  if (input.samples.length === 0) {
    throw new Error("Choreography quality evaluation requires samples.");
  }
  const samples = [...input.samples].sort(
    (left, right) => left.progress - right.progress
  );
  const ranges = {
    ...defaultKpChoreographyQualityRanges,
    ...input.ranges
  };
  validateRanges(ranges);
  const diagnostics: KpChoreographyQualityDiagnostic[] = [];
  samples.forEach((sample) => {
    if (
      sample.actProgress > 0 &&
      sample.focusReadiness < ranges.minimumFocusReadinessBeforeAct
    ) {
      push(
        diagnostics,
        "choreography.focus-lead",
        "error",
        sample,
        sample.focusReadiness,
        ranges.minimumFocusReadinessBeforeAct,
        "Meaningful act begins before focus crosses readiness."
      );
    }
    if (
      sample.actProgress > 0 &&
      sample.explanatorySalience < ranges.minimumExplanatorySalience
    ) {
      push(
        diagnostics,
        "choreography.attention-gap",
        "error",
        sample,
        sample.explanatorySalience,
        ranges.minimumExplanatorySalience,
        "No explanatory entity remains sufficiently salient during the act."
      );
    }
    if (
      sample.actProgress > 0 &&
      sample.reflowProgress < 1 &&
      !sample.governedReflowActOverlap
    ) {
      push(
        diagnostics,
        "choreography.premature-act",
        "error",
        sample,
        sample.reflowProgress,
        1,
        "Act begins before reflow completes without a governed-overlap sample."
      );
    }
    if (
      sample.eliminationProgress > 0 &&
      sample.causeLegibility <
        ranges.minimumCauseLegibilityBeforeElimination
    ) {
      push(
        diagnostics,
        "choreography.premature-elimination",
        "error",
        sample,
        sample.causeLegibility,
        ranges.minimumCauseLegibilityBeforeElimination,
        "An entity begins elimination before its cause is legible."
      );
    }
    if (sample.groupSeparation > sample.maximumGroupSeparation) {
      push(
        diagnostics,
        "choreography.cohesion",
        "error",
        sample,
        sample.groupSeparation,
        sample.maximumGroupSeparation,
        "A moving semantic group exceeds its declared cohesion bound."
      );
    }
    if (sample.stableCheckpoint) {
      if (sample.residualTransform > ranges.maximumResidualTransform) {
        push(
          diagnostics,
          "choreography.residual-transform",
          "error",
          sample,
          sample.residualTransform,
          ranges.maximumResidualTransform,
          "A stable checkpoint retains a temporary transform."
        );
      }
      if (sample.residualDeformation > ranges.maximumResidualDeformation) {
        push(
          diagnostics,
          "choreography.residual-deformation",
          "error",
          sample,
          sample.residualDeformation,
          ranges.maximumResidualDeformation,
          "A stable checkpoint retains organic deformation."
        );
      }
      if (sample.speed > ranges.maximumStableCheckpointSpeed) {
        push(
          diagnostics,
          "choreography.endpoint-stillness",
          "error",
          sample,
          sample.speed,
          ranges.maximumStableCheckpointSpeed,
          "A stable recognition or endpoint checkpoint is not still."
        );
      }
    }
    if (
      sample.actProgress > 0 &&
      sample.materialContinuity < ranges.minimumMaterialContinuity
    ) {
      push(
        diagnostics,
        "choreography.material-continuity",
        "warning",
        sample,
        sample.materialContinuity,
        ranges.minimumMaterialContinuity,
        "Causal material flow is too weak to support perceptual continuity."
      );
    }
  });
  return {
    kind: "choreography-quality-report",
    passedAutomatedGates:
      diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    diagnostics,
    ranges,
    calibrationSource: "dashboard-exemplar-baseline-v0",
    subjectiveReviewRequired: true,
    humanReviewRubric: [
      "causal-legibility",
      "semantic-object-constancy",
      "attention-continuity",
      "organic-coherence",
      "typographic-integrity",
      "pacing-and-dwell",
      "visual-restraint",
      "rewind-comprehension",
      "reduced-motion-equivalence"
    ]
  };
}

function push(
  diagnostics: KpChoreographyQualityDiagnostic[],
  code: KpChoreographyQualityDiagnostic["code"],
  severity: KpChoreographyQualityDiagnostic["severity"],
  sample: KpChoreographyQualitySample,
  measured: number,
  threshold: number,
  message: string
): void {
  diagnostics.push({
    code,
    severity,
    progress: sample.progress,
    measured,
    threshold,
    message
  });
}

function validateRanges(ranges: KpChoreographyQualityRanges): void {
  Object.entries(ranges).forEach(([key, value]) => {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`Choreography quality range ${key} must be nonnegative.`);
    }
  });
}
