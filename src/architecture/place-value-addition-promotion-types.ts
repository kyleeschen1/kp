declare const placeValueAdditionPromotionReadinessAuthority: unique symbol;

export const kpPlaceValueAdditionPromotionPrerequisiteIds = [
  "verified-place-value-trace",
  "canonical-motif-closure",
  "synchronized-written-and-base-ten-runtime",
  "exclusive-runtime-ownership",
  "responsive-and-resource-policy",
  "accessible-static-export",
  "lazy-animation-library-host",
  "three-browser-review-contract"
] as const;

export type KpPlaceValueAdditionPromotionPrerequisiteId =
  typeof kpPlaceValueAdditionPromotionPrerequisiteIds[number];

export interface KpPlaceValueAdditionPromotionPrerequisiteEvidence {
  readonly id: KpPlaceValueAdditionPromotionPrerequisiteId;
  readonly evidenceSourceIds: readonly string[];
}

export interface KpPlaceValueAdditionPromotionEvidenceIssue {
  readonly code:
    | "promotion-evidence.missing"
    | "promotion-evidence.duplicate"
    | "promotion-evidence.empty-source";
  readonly prerequisiteId?:
    KpPlaceValueAdditionPromotionPrerequisiteId | undefined;
  readonly message: string;
}

/**
 * Automated evidence can mint this nominal token, but it intentionally has no
 * authorable approval flag. Catalog promotion therefore still requires the
 * later human-review token rather than a structurally similar object.
 */
export interface KpVerifiedPlaceValueAdditionPromotionReadiness {
  readonly schemaVersion:
    "kp.verified-place-value-addition-promotion-readiness.v1";
  readonly animationId:
    "animation.place-value-addition.278-plus-156";
  readonly status: "ready-for-human-review";
  readonly prerequisiteEvidence:
    readonly KpPlaceValueAdditionPromotionPrerequisiteEvidence[];
  readonly remainingGate: "human-perceptual-review";
  readonly [placeValueAdditionPromotionReadinessAuthority]: true;
}
