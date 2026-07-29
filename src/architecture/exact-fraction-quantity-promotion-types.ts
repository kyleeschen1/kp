declare const exactFractionQuantityPromotionReadinessAuthority: unique symbol;

export const kpExactFractionQuantityPromotionPrerequisiteIds = [
  "verified-exact-semantic-trace",
  "sealed-four-view-correspondence",
  "canonical-motif-closure",
  "exclusive-paint-ownership",
  "certified-responsive-layout",
  "accessible-static-export",
  "reviewable-animation-library-host",
  "three-browser-resource-contract",
  "evidence-derived-partial-status"
] as const;

export type KpExactFractionQuantityPromotionPrerequisiteId =
  typeof kpExactFractionQuantityPromotionPrerequisiteIds[number];

export interface KpExactFractionQuantityPromotionPrerequisiteEvidence {
  readonly id: KpExactFractionQuantityPromotionPrerequisiteId;
  readonly evidenceSourceIds: readonly string[];
}

export interface KpExactFractionQuantityPromotionEvidenceIssue {
  readonly code:
    | "promotion-evidence.missing"
    | "promotion-evidence.duplicate"
    | "promotion-evidence.empty-source";
  readonly prerequisiteId?: KpExactFractionQuantityPromotionPrerequisiteId;
  readonly message: string;
}

/**
 * This nominal token proves only automated pre-release closure. Its shape
 * deliberately has no authorable human-review boolean and cannot promote the
 * catalog entry without the later release approval.
 */
export interface KpVerifiedExactFractionQuantityPromotionReadiness {
  readonly schemaVersion:
    "kp.verified-exact-fraction-quantity-promotion-readiness.v1";
  readonly animationId:
    "animation.exact-fraction-quantity.third-plus-sixth";
  readonly status: "ready-for-human-review";
  readonly prerequisiteEvidence:
    readonly KpExactFractionQuantityPromotionPrerequisiteEvidence[];
  readonly remainingGate: "human-perceptual-review";
  readonly [exactFractionQuantityPromotionReadinessAuthority]: true;
}
