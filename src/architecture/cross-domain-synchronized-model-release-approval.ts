import {
  kpCrossDomainAnimationApiAudit
} from "./cross-domain-animation-api-audit.ts";
import {
  kpDimensionalContinuityGraphLanguageId
} from "../rendering/dimensional-continuity-graph-profile.ts";

const economicsAnimationId =
  "animation.economics.supply-demand-equilibrium-shift";
const physicsAnimationId =
  "animation.physics.constant-force-work-energy";

export type KpApprovedCrossDomainSynchronizedModelAnimationId =
  | typeof economicsAnimationId
  | typeof physicsAnimationId;

export interface KpVerifiedCrossDomainSynchronizedModelReleaseApproval {
  readonly schemaVersion:
    "kp.verified-cross-domain-synchronized-model-release-approval.v1";
  readonly animationId: KpApprovedCrossDomainSynchronizedModelAnimationId;
  readonly reviewDecision:
    | "approved-economics-exemplar"
    | "approved-physics-exemplar";
  readonly releaseDecision: "passed";
  readonly graphLanguageProfileId:
    typeof kpDimensionalContinuityGraphLanguageId;
  readonly sharedContractCount: 4;
  readonly evidenceSourceIds: readonly [
    "run-contract.kp.catalogue-curation-cross-domain-promotion-v1",
    "docs/project/decisions/2026-08-01-kp-dimensional-continuity-graph-and-diagram-language.md",
    "docs/project/reviews/2026-08-01-cross-domain-api-motif-audit.md"
  ];
}

const approvedCallerIds = Object.freeze([
  economicsAnimationId,
  physicsAnimationId
] as const);
const promotedContracts = kpCrossDomainAnimationApiAudit.filter(
  ({ decision }) => decision === "promote-shared-contract"
);

if (
  promotedContracts.length !== 4 ||
  !promotedContracts.every(({ callerAnimationIds }) =>
    approvedCallerIds.every((animationId) =>
      callerAnimationIds.includes(animationId)
    )
  )
) {
  throw new Error(
    "Cross-domain release approval requires four two-caller shared contracts."
  );
}

/**
 * Human approval and the broad release gate are nominal release inputs. The
 * display catalog accepts only these module-owned values, so copied evidence
 * or an authorable boolean cannot claim that either exemplar is promoted.
 */
export const kpVerifiedEconomicsEquilibriumReleaseApproval = approval({
  animationId: economicsAnimationId,
  reviewDecision: "approved-economics-exemplar"
});

export const kpVerifiedPhysicsWorkEnergyReleaseApproval = approval({
  animationId: physicsAnimationId,
  reviewDecision: "approved-physics-exemplar"
});

export function isKpVerifiedCrossDomainSynchronizedModelReleaseApproval(
  value: unknown
): value is KpVerifiedCrossDomainSynchronizedModelReleaseApproval {
  return value === kpVerifiedEconomicsEquilibriumReleaseApproval ||
    value === kpVerifiedPhysicsWorkEnergyReleaseApproval;
}

function approval(input: {
  readonly animationId: KpApprovedCrossDomainSynchronizedModelAnimationId;
  readonly reviewDecision:
    KpVerifiedCrossDomainSynchronizedModelReleaseApproval["reviewDecision"];
}): KpVerifiedCrossDomainSynchronizedModelReleaseApproval {
  return Object.freeze({
    schemaVersion:
      "kp.verified-cross-domain-synchronized-model-release-approval.v1",
    animationId: input.animationId,
    reviewDecision: input.reviewDecision,
    releaseDecision: "passed",
    graphLanguageProfileId:
      kpDimensionalContinuityGraphLanguageId,
    sharedContractCount: 4,
    evidenceSourceIds: Object.freeze([
      "run-contract.kp.catalogue-curation-cross-domain-promotion-v1",
      "docs/project/decisions/2026-08-01-kp-dimensional-continuity-graph-and-diagram-language.md",
      "docs/project/reviews/2026-08-01-cross-domain-api-motif-audit.md"
    ] as const)
  });
}
