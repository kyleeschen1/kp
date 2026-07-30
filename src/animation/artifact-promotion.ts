import type {
  KpAnimatedPresentationCoverage
} from "./operation-presentation-plan-types.ts";

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

export interface KpArtifactPromotionLineage {
  readonly schemaVersion: "kp.artifact-promotion-lineage.v1";
  readonly animationId: string;
  readonly facet: KpArtifactPromotionFacet;
  readonly presentationCoverage: KpAnimatedPresentationCoverage;
  readonly evidenceSourceIds: readonly string[];
}

interface KpReviewedAnimationPromotionRecordBase {
  readonly animationId: string;
  readonly evidenceSourceIds: readonly string[];
}

type KpReviewedAnimationPromotionRecord =
  KpReviewedAnimationPromotionRecordBase & (
    | {
        readonly maturity: "promoted";
        readonly presentationCoverage: "verified-animated";
      }
    | {
        readonly maturity: "gold";
        readonly presentationCoverage: KpAnimatedPresentationCoverage;
      }
  );

const reviewedAnimationPromotionRecords = Object.freeze([
  {
    animationId:
      "animation.exact-fraction-quantity.third-plus-sixth",
    maturity: "promoted",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: [
      "review.kp.exact-fraction-quantity-persistent-stage-human-checkpoint",
      "run-contract.kp.executable-motif-perceptual-continuity-repair-v0"
    ]
  },
  {
    animationId: "animation.linear-solve.solve-x",
    maturity: "gold",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: [
      "docs/project/reviews/2026-07-21-solve-x-human-checkpoint-follow-up.md"
    ]
  },
  {
    animationId: "animation.generated.radical.square-root-as-power",
    maturity: "promoted",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: [
      "docs/project/reviews/2026-07-16-material-continuity-artifact-morph-loop-closeout.md",
      "run-contract.kp.authoritative-roadmap-workbench-v1#s27"
    ]
  },
  {
    animationId: "animation.generated.function-wrap.apply-f",
    maturity: "gold",
    presentationCoverage: "incomplete",
    evidenceSourceIds: [
      "docs/project/reviews/2026-07-16-phase-ordered-choreography-gestalt-style-loop-closeout.md"
    ]
  },
  {
    animationId: "animation.generated.distribution.expand-a-sum",
    maturity: "gold",
    presentationCoverage: "incomplete",
    evidenceSourceIds: [
      "docs/project/reviews/2026-07-23-governed-semantic-authoring-exemplar-checkpoint.md",
      "run-contract.kp.authoritative-roadmap-workbench-v1#s29"
    ]
  },
  {
    animationId: "animation.derivative-rules.tangent-graph",
    maturity: "gold",
    presentationCoverage: "incomplete",
    evidenceSourceIds: [
      "docs/project/reviews/2026-07-23-derivative-secant-tangent-checkpoint.md"
    ]
  }
] as const satisfies readonly KpReviewedAnimationPromotionRecord[]);

export const kpGoldEquationAnimationIds = Object.freeze(
  reviewedAnimationPromotionRecords.map(({ animationId }) => animationId)
);

export const kpPromotedEquationAnimationIds = Object.freeze(
  reviewedAnimationPromotionRecords
    .filter(({ maturity }) => maturity === "promoted")
    .map(({ animationId }) => animationId)
);

export function resolveKpAnimationPromotionLineage(input: {
  readonly animationId: string;
  readonly novelty?: KpArtifactNovelty | undefined;
}): KpArtifactPromotionLineage {
  const record = reviewedAnimationPromotionRecords.find(
    ({ animationId }) => animationId === input.animationId
  );
  const novelty = input.novelty ?? "composition";
  return {
    schemaVersion: "kp.artifact-promotion-lineage.v1",
    animationId: input.animationId,
    facet: {
      maturity: record?.maturity ?? "reviewable",
      novelty,
      humanReviewRequired: novelty !== "composition",
      goldCohort: record !== undefined
    },
    presentationCoverage:
      record?.presentationCoverage ?? "incomplete",
    evidenceSourceIds:
      record?.evidenceSourceIds ??
      ["artifact-promotion.default-reviewable-composition-policy"]
  };
}

export function resolveKpAnimationPromotionFacet(input: {
  readonly animationId: string;
  readonly novelty?: KpArtifactNovelty | undefined;
}): KpArtifactPromotionFacet {
  return resolveKpAnimationPromotionLineage(input).facet;
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
