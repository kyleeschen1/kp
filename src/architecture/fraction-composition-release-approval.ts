const fractionCompositionReleaseApprovalAuthority =
  Symbol("kp.fraction-composition-release-approval");

export interface KpVerifiedFractionCompositionReleaseApproval {
  readonly schemaVersion:
    "kp.verified-fraction-composition-release-approval.v1";
  readonly animationId:
    "animation.fraction-composition.two-thirds-solve";
  readonly reviewDecision: "approved-repair-complete";
  readonly releaseDecision: "passed";
  readonly evidenceSourceIds: readonly [
    "review.kp.canonical-fraction-composition-human-visual-checkpoint",
    "run-contract.kp.canonical-fraction-composition-promotion-v1"
  ];
  readonly [fractionCompositionReleaseApprovalAuthority]: true;
}

/**
 * Human visual judgment cannot be derived from renderer output. We encode that
 * irreducible decision once as a nominal approval, so downstream catalogs can
 * consume provenance but cannot independently author "ported" booleans.
 */
export const kpVerifiedFractionCompositionReleaseApproval:
KpVerifiedFractionCompositionReleaseApproval = Object.freeze({
  schemaVersion:
    "kp.verified-fraction-composition-release-approval.v1",
  animationId:
    "animation.fraction-composition.two-thirds-solve",
  reviewDecision: "approved-repair-complete",
  releaseDecision: "passed",
  evidenceSourceIds: Object.freeze([
    "review.kp.canonical-fraction-composition-human-visual-checkpoint",
    "run-contract.kp.canonical-fraction-composition-promotion-v1"
  ] as const),
  [fractionCompositionReleaseApprovalAuthority]: true as const
});
