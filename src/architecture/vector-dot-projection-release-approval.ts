import {
  kpDimensionalContinuityGraphLanguageId
} from "../rendering/dimensional-continuity-graph-profile.ts";

export const kpVectorDotProjectionAnimationId =
  "animation.dot-projection.basic" as const;

export interface KpVerifiedVectorDotProjectionReleaseApproval {
  readonly schemaVersion:
    "kp.verified-vector-dot-projection-release-approval.v1";
  readonly animationId: typeof kpVectorDotProjectionAnimationId;
  readonly reviewDecision: "approved-after-endpoint-halo-correction";
  readonly catalogueDisposition: "keep";
  readonly releaseDecision: "passed";
  readonly graphLanguageProfileId:
    typeof kpDimensionalContinuityGraphLanguageId;
  readonly checkpointCount: 7;
  readonly evidenceSourceIds: readonly [
    "run-contract.kp.six-loop-product-convergence-v0",
    "next-action.kp.vector-label-attenuation-correction-v0",
    "docs/project/reviews/2026-08-02-vector-dot-projection-review-package.md",
    "docs/project/decisions/2026-08-02-kp-checkpoint-and-product-surface-sequence.md"
  ];
}

/**
 * Human approval is a nominal release input. Consumers accept only this
 * module-owned value, so a copied object or authorable boolean cannot promote
 * the vector exemplar or assign its catalogue disposition.
 */
export const kpVerifiedVectorDotProjectionReleaseApproval = Object.freeze({
  schemaVersion:
    "kp.verified-vector-dot-projection-release-approval.v1",
  animationId: kpVectorDotProjectionAnimationId,
  reviewDecision: "approved-after-endpoint-halo-correction",
  catalogueDisposition: "keep",
  releaseDecision: "passed",
  graphLanguageProfileId: kpDimensionalContinuityGraphLanguageId,
  checkpointCount: 7,
  evidenceSourceIds: Object.freeze([
    "run-contract.kp.six-loop-product-convergence-v0",
    "next-action.kp.vector-label-attenuation-correction-v0",
    "docs/project/reviews/2026-08-02-vector-dot-projection-review-package.md",
    "docs/project/decisions/2026-08-02-kp-checkpoint-and-product-surface-sequence.md"
  ] as const)
}) satisfies KpVerifiedVectorDotProjectionReleaseApproval;

export function isKpVerifiedVectorDotProjectionReleaseApproval(
  value: unknown
): value is KpVerifiedVectorDotProjectionReleaseApproval {
  return value === kpVerifiedVectorDotProjectionReleaseApproval;
}
