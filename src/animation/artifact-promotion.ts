export const KP_ARTIFACT_MATURITY_LEVELS = [
  "draft",
  "reviewable",
  "gold",
  "promoted"
] as const;

export type KpArtifactMaturity = typeof KP_ARTIFACT_MATURITY_LEVELS[number];

export const KP_ARTIFACT_NOVELTY_LEVELS = [
  "composition",
  "new-combination",
  "new-primitive"
] as const;

export type KpArtifactNovelty = typeof KP_ARTIFACT_NOVELTY_LEVELS[number];

export interface KpArtifactPromotionFacet {
  readonly maturity: KpArtifactMaturity;
  readonly novelty: KpArtifactNovelty;
  readonly humanReviewRequired: boolean;
  readonly goldCohort: boolean;
}

export interface KpArtifactPromotionEvidence {
  readonly automatedGatesPassed: boolean;
  readonly humanReviewPassed: boolean;
  readonly conformancePassed: boolean;
  readonly canonicalExemplarReviewed: boolean;
}

export interface KpArtifactPromotionDecision {
  readonly kind: "artifact-promotion-decision";
  readonly status: "approved" | "blocked";
  readonly from: KpArtifactMaturity;
  readonly to: KpArtifactMaturity;
  readonly diagnostics: readonly string[];
}

export const kpGoldEquationAnimationIds = Object.freeze([
  "animation.linear-solve.solve-x",
  "animation.generated.radical.square-root-as-power",
  "animation.generated.function-wrap.apply-f",
  "animation.generated.distribution.expand-a-sum"
] as const);

export function resolveKpAnimationPromotionFacet(input: {
  readonly animationId: string;
  readonly novelty?: KpArtifactNovelty | undefined;
}): KpArtifactPromotionFacet {
  const goldCohort = kpGoldEquationAnimationIds.includes(
    input.animationId as (typeof kpGoldEquationAnimationIds)[number]
  );
  const novelty = input.novelty ?? "composition";
  return {
    maturity: goldCohort ? "gold" : "reviewable",
    novelty,
    humanReviewRequired: novelty !== "composition",
    goldCohort
  };
}

export function decideKpArtifactPromotion(input: {
  readonly current: KpArtifactMaturity;
  readonly requested: KpArtifactMaturity;
  readonly novelty: KpArtifactNovelty;
  readonly evidence: KpArtifactPromotionEvidence;
}): KpArtifactPromotionDecision {
  const diagnostics: string[] = [];
  const fromRank = KP_ARTIFACT_MATURITY_LEVELS.indexOf(input.current);
  const toRank = KP_ARTIFACT_MATURITY_LEVELS.indexOf(input.requested);
  if (toRank < fromRank) diagnostics.push("Promotion cannot lower maturity.");
  if (toRank > fromRank + 1) {
    diagnostics.push("Promotion must pass through each maturity checkpoint.");
  }
  if (toRank >= 1 && !input.evidence.automatedGatesPassed) {
    diagnostics.push("Reviewable artifacts require automated semantic and mechanical gates.");
  }
  if (toRank >= 2 && !input.evidence.humanReviewPassed) {
    diagnostics.push("Gold artifacts require explicit human perceptual review.");
  }
  if (toRank >= 3 && !input.evidence.conformancePassed) {
    diagnostics.push("Promoted artifacts require gold conformance evidence.");
  }
  if (
    input.novelty === "new-primitive" &&
    toRank >= 2 &&
    !input.evidence.canonicalExemplarReviewed
  ) {
    diagnostics.push("A new primitive requires a reviewed canonical exemplar before gold.");
  }
  if (
    input.novelty === "new-combination" &&
    toRank >= 2 &&
    !input.evidence.canonicalExemplarReviewed
  ) {
    diagnostics.push("A new combination requires cohort review before gold.");
  }
  return {
    kind: "artifact-promotion-decision",
    status: diagnostics.length === 0 ? "approved" : "blocked",
    from: input.current,
    to: input.requested,
    diagnostics
  };
}
