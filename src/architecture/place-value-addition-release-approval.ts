import {
  kpPlaceValueContributorFusionMotifKind
} from "../rendering/place-value-addition-contributor-fusion-motif.ts";
import {
  createKpPlaceValueAdditionRuntimeSession
} from "../rendering/place-value-addition-runtime.ts";
import {
  compileKpPlaceValueEvaluationVisualMotifs
} from "../rendering/place-value-addition-shared-dom.ts";
import {
  certifyKpPlaceValueAdditionPromotionReadiness,
  isKpVerifiedPlaceValueAdditionPromotionReadiness,
  type KpVerifiedPlaceValueAdditionPromotionReadiness
} from "./place-value-addition-promotion-certificate.ts";

const animationId = "animation.place-value-addition.278-plus-156";
const humanApprovalEvidenceSourceId =
  "next-action.refill.experiment.plan-revision.kp.v18." +
  "composition-environment-sequence";

export interface KpVerifiedPlaceValueAdditionReleaseApproval {
  readonly schemaVersion:
    "kp.verified-place-value-addition-release-approval.v1";
  readonly animationId: typeof animationId;
  readonly reviewDecision: "approved-contributor-fusion";
  readonly releaseDecision: "passed";
  readonly readiness: KpVerifiedPlaceValueAdditionPromotionReadiness;
  readonly promotedPositionCount: 3;
  readonly evidenceSourceIds: readonly [
    typeof humanApprovalEvidenceSourceId,
    "docs/project/reviews/2026-07-31-place-value-persistent-workspace-repair-closeout.md"
  ];
}

const readiness = certifyKpPlaceValueAdditionPromotionReadiness();
const motifs = compileKpPlaceValueEvaluationVisualMotifs(
  createKpPlaceValueAdditionRuntimeSession().columnEvaluations
);
if (
  !isKpVerifiedPlaceValueAdditionPromotionReadiness(readiness) ||
  motifs.length !== 3 ||
  !motifs.every(({ kind }) => kind === kpPlaceValueContributorFusionMotifKind)
) {
  throw new Error(
    "Place-value release approval requires readiness and exhaustive fusion."
  );
}

/**
 * Human approval is a nominal release input, separate from automated
 * readiness. Catalog code accepts only this exact module-owned value, so an
 * authorable boolean or copied certificate cannot claim a ported animation.
 */
export const kpVerifiedPlaceValueAdditionReleaseApproval:
KpVerifiedPlaceValueAdditionReleaseApproval = Object.freeze({
  schemaVersion: "kp.verified-place-value-addition-release-approval.v1",
  animationId,
  reviewDecision: "approved-contributor-fusion",
  releaseDecision: "passed",
  readiness,
  promotedPositionCount: 3,
  evidenceSourceIds: Object.freeze([
    humanApprovalEvidenceSourceId,
    "docs/project/reviews/2026-07-31-place-value-persistent-workspace-repair-closeout.md"
  ] as const)
});

export function isKpVerifiedPlaceValueAdditionReleaseApproval(
  value: unknown
): value is KpVerifiedPlaceValueAdditionReleaseApproval {
  return value === kpVerifiedPlaceValueAdditionReleaseApproval;
}
