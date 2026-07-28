declare const fractionCompositionPromotionReadinessAuthority: unique symbol;

export const kpFractionCompositionPromotionPrerequisiteIds = [
  "verified-semantic-trace",
  "canonical-motif-closure",
  "exclusive-reader-ownership",
  "certified-responsive-layout",
  "compatibility-route-retired",
  "accessible-product-seams",
  "static-export-closure",
  "review-host-readiness"
] as const;

export type KpFractionCompositionPromotionPrerequisiteId =
  typeof kpFractionCompositionPromotionPrerequisiteIds[number];

export interface KpFractionCompositionPromotionPrerequisiteEvidence {
  readonly id: KpFractionCompositionPromotionPrerequisiteId;
  readonly evidenceSourceIds: readonly string[];
}

export interface KpFractionCompositionPromotionReadinessInput {
  readonly markdown: string;
}

/**
 * Keep the nominal shape independent of the runtime verifier. Compile-time
 * anti-forgery tests should not have to instantiate the renderer dependency
 * graph merely to prove that callers cannot construct this certificate.
 */
export interface KpVerifiedFractionCompositionPromotionReadiness {
  readonly schemaVersion:
    "kp.verified-fraction-composition-promotion-readiness.v1";
  readonly animationId:
    "animation.fraction-composition.two-thirds-solve";
  readonly status: "ready-for-human-review";
  readonly prerequisiteEvidence:
    readonly KpFractionCompositionPromotionPrerequisiteEvidence[];
  readonly remainingGate: "human-perceptual-review";
  readonly [fractionCompositionPromotionReadinessAuthority]: true;
}
