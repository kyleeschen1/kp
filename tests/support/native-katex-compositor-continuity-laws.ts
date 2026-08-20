import type {
  KpNativeKatexConformancePaintOwner,
  KpNativeKatexConformanceSeamSample,
  KpNativeKatexConformanceSeamTrace
} from "./native-katex-compositor-seam-trace.ts";

export const kpNativeKatexCompositorContinuityTolerance = Object.freeze({
  maximumSeamTranslationPx: 0.25,
  maximumSeamScaleRatio: 1.1,
  minimumActiveOwnerOpacity: 0.99,
  maximumInactiveOwnerOpacity: 0.01
});

export type KpNativeKatexContinuityFailureReason =
  | "horizontal-translation"
  | "vertical-translation"
  | "scale-discontinuity"
  | "active-owner-hidden"
  | "inactive-owner-visible";

export interface KpNativeKatexConformanceSeamAssessment {
  readonly seam: "source-to-material" | "material-to-target";
  readonly passed: boolean;
  readonly fromSlot: KpNativeKatexConformanceSeamSample["slot"];
  readonly toSlot: KpNativeKatexConformanceSeamSample["slot"];
  readonly horizontalTranslationPx: number;
  readonly verticalTranslationPx: number;
  readonly widthScaleRatio: number;
  readonly heightScaleRatio: number;
  readonly failureReasons: readonly KpNativeKatexContinuityFailureReason[];
}

export interface KpNativeKatexConformanceContinuityAssessment {
  readonly kind: "native-katex-compositor-continuity-assessment";
  readonly transitionId: string;
  readonly semanticEntityId: string;
  readonly shapeId: KpNativeKatexConformanceSeamTrace["shapeId"];
  readonly passed: boolean;
  readonly seams: readonly KpNativeKatexConformanceSeamAssessment[];
}

export function assessKpNativeKatexCompositorContinuity(input: {
  readonly trace: KpNativeKatexConformanceSeamTrace;
  readonly tolerance?: typeof kpNativeKatexCompositorContinuityTolerance;
}): KpNativeKatexConformanceContinuityAssessment {
  const tolerance = input.tolerance ??
    kpNativeKatexCompositorContinuityTolerance;
  validateTolerance(tolerance);
  const samples = input.trace.samples;
  const seams = Object.freeze([
    assessSeam(
      "source-to-material",
      samples[0]!,
      samples[1]!,
      tolerance
    ),
    assessSeam(
      "material-to-target",
      samples[3]!,
      samples[4]!,
      tolerance
    )
  ]);
  return Object.freeze({
    kind: "native-katex-compositor-continuity-assessment" as const,
    transitionId: input.trace.transitionId,
    semanticEntityId: input.trace.semanticEntityId,
    shapeId: input.trace.shapeId,
    passed: seams.every(({ passed }) => passed),
    seams
  });
}

function assessSeam(
  seam: KpNativeKatexConformanceSeamAssessment["seam"],
  from: KpNativeKatexConformanceSeamSample,
  to: KpNativeKatexConformanceSeamSample,
  tolerance: typeof kpNativeKatexCompositorContinuityTolerance
): KpNativeKatexConformanceSeamAssessment {
  const fromRect = from.observation.rect;
  const toRect = to.observation.rect;
  const horizontalTranslationPx = toRect.left - fromRect.left;
  const verticalTranslationPx = verticalAnchor(to) - verticalAnchor(from);
  const widthScaleRatio = symmetricScaleRatio(toRect.width, fromRect.width);
  const heightScaleRatio = symmetricScaleRatio(toRect.height, fromRect.height);
  const failureReasons: KpNativeKatexContinuityFailureReason[] = [];
  if (
    Math.abs(horizontalTranslationPx) > tolerance.maximumSeamTranslationPx
  ) {
    failureReasons.push("horizontal-translation");
  }
  if (Math.abs(verticalTranslationPx) > tolerance.maximumSeamTranslationPx) {
    failureReasons.push("vertical-translation");
  }
  if (
    widthScaleRatio > tolerance.maximumSeamScaleRatio ||
    heightScaleRatio > tolerance.maximumSeamScaleRatio
  ) {
    failureReasons.push("scale-discontinuity");
  }
  for (const sample of [from, to]) {
    if (
      sample.paintOpacityByOwner[sample.owner] <
        tolerance.minimumActiveOwnerOpacity &&
      !failureReasons.includes("active-owner-hidden")
    ) {
      failureReasons.push("active-owner-hidden");
    }
    if (
      inactiveOwners(sample.owner).some((owner) =>
        sample.paintOpacityByOwner[owner] >
          tolerance.maximumInactiveOwnerOpacity
      ) &&
      !failureReasons.includes("inactive-owner-visible")
    ) {
      failureReasons.push("inactive-owner-visible");
    }
  }
  return Object.freeze({
    seam,
    passed: failureReasons.length === 0,
    fromSlot: from.slot,
    toSlot: to.slot,
    horizontalTranslationPx,
    verticalTranslationPx,
    widthScaleRatio,
    heightScaleRatio,
    failureReasons: Object.freeze(failureReasons)
  });
}

function verticalAnchor(sample: KpNativeKatexConformanceSeamSample): number {
  return sample.observation.baselineY ?? sample.observation.rect.top;
}

function symmetricScaleRatio(target: number, source: number): number {
  if (!(target > 0) || !(source > 0)) return Number.POSITIVE_INFINITY;
  const ratio = target / source;
  return Math.max(ratio, 1 / ratio);
}

function inactiveOwners(
  active: KpNativeKatexConformancePaintOwner
): readonly KpNativeKatexConformancePaintOwner[] {
  return (["native-source", "material", "native-target"] as const)
    .filter((owner) => owner !== active);
}

function validateTolerance(
  tolerance: typeof kpNativeKatexCompositorContinuityTolerance
): void {
  if (
    !Number.isFinite(tolerance.maximumSeamTranslationPx) ||
    tolerance.maximumSeamTranslationPx < 0 ||
    !Number.isFinite(tolerance.maximumSeamScaleRatio) ||
    tolerance.maximumSeamScaleRatio < 1 ||
    !Number.isFinite(tolerance.minimumActiveOwnerOpacity) ||
    tolerance.minimumActiveOwnerOpacity < 0 ||
    tolerance.minimumActiveOwnerOpacity > 1 ||
    !Number.isFinite(tolerance.maximumInactiveOwnerOpacity) ||
    tolerance.maximumInactiveOwnerOpacity < 0 ||
    tolerance.maximumInactiveOwnerOpacity > 1
  ) {
    throw new Error("Compositor continuity tolerances are invalid.");
  }
}
