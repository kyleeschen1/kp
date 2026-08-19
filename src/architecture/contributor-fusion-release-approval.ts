import {
  kpFivePlusTwoEvaluationAnimationId,
  kpThreeSixthsEvaluationAnimationId,
  kpTwoTimesThreeEvaluationAnimationId
} from "../animation/operation-evaluation-adapter.ts";
import {
  kpContributorFusionEvaluationFamilyProfile
} from "../animation/operation-evaluation-family-profile.ts";
import {
  kpNativeKatexContributorFusionOpticalProfile
} from "../rendering/native-katex-operation-evaluation-contributor-fusion.ts";

export const kpContributorFusionReleasedAnimationIds = Object.freeze([
  kpTwoTimesThreeEvaluationAnimationId,
  kpThreeSixthsEvaluationAnimationId,
  kpFivePlusTwoEvaluationAnimationId
] as const);

export type KpContributorFusionReleasedAnimationId =
  typeof kpContributorFusionReleasedAnimationIds[number];

export interface KpVerifiedContributorFusionReleaseApproval {
  readonly schemaVersion: "kp.verified-contributor-fusion-release-approval.v1";
  readonly animationIds: typeof kpContributorFusionReleasedAnimationIds;
  readonly familyProfileId: typeof kpContributorFusionEvaluationFamilyProfile.id;
  readonly rendererProfileId:
    typeof kpNativeKatexContributorFusionOpticalProfile.id;
  readonly approvedPressureKinds: readonly ["product", "quotient"];
  readonly confirmationKind: "sum";
  readonly reviewDecision: "approved-after-product-and-quotient-pressure";
  readonly releaseDecision: "passed";
  readonly evidenceSourceIds: readonly [
    "docs/project/decisions/2026-08-19-kp-paint-ownership-and-evaluation-presentation-direction.md",
    "docs/project/reviews/2026-08-19-post-quotient-ink-knot-pressure-next-step-review.md",
    "tests/operation-evaluation-family-exemplar.browser.spec.ts",
    "package-script.visual:operation-evaluation-contributor-fusion"
  ];
}

/**
 * Human approval belongs to the two pressure exemplars. The sum contributes
 * structural confirmation only; it cannot silently broaden the reviewed
 * visual grammar or authorize another evaluation family.
 */
export const kpVerifiedContributorFusionReleaseApproval = Object.freeze({
  schemaVersion: "kp.verified-contributor-fusion-release-approval.v1",
  animationIds: kpContributorFusionReleasedAnimationIds,
  familyProfileId: kpContributorFusionEvaluationFamilyProfile.id,
  rendererProfileId: kpNativeKatexContributorFusionOpticalProfile.id,
  approvedPressureKinds: Object.freeze(["product", "quotient"] as const),
  confirmationKind: "sum",
  reviewDecision: "approved-after-product-and-quotient-pressure",
  releaseDecision: "passed",
  evidenceSourceIds: Object.freeze([
    "docs/project/decisions/2026-08-19-kp-paint-ownership-and-evaluation-presentation-direction.md",
    "docs/project/reviews/2026-08-19-post-quotient-ink-knot-pressure-next-step-review.md",
    "tests/operation-evaluation-family-exemplar.browser.spec.ts",
    "package-script.visual:operation-evaluation-contributor-fusion"
  ] as const)
}) satisfies KpVerifiedContributorFusionReleaseApproval;

export function isKpVerifiedContributorFusionReleaseApproval(
  value: unknown
): value is KpVerifiedContributorFusionReleaseApproval {
  return value === kpVerifiedContributorFusionReleaseApproval;
}

