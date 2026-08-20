import {
  createKpLearnerExperienceLibrary,
  type KpLearnerExperienceDescriptor
} from "./learner-experience-library.ts";

// This source-rich builder runs in generation and verification only. Browser
// review surfaces consume its generated projection so certificates and
// renderer graphs cannot leak into a metadata route.
import {
  createKpSemanticAnimationWorkbenchIndex
} from "./semantic-animation-workbench-data.ts";
import type {
  KpSemanticAnimationWorkbenchIndexEntry
} from "./semantic-animation-workbench-index.ts";
import type {
  KpAnimationRepresentationRelationship
} from "./semantic-animation-workbench-representation.ts";
import {
  kpVerifiedFractionCompositionReleaseApproval,
  type KpVerifiedFractionCompositionReleaseApproval
} from "../architecture/fraction-composition-release-approval.ts";
import type {
  KpAnimatedPresentationCoverage
} from "../animation/operation-presentation-plan-types.ts";
import {
  isKpVerifiedExecutableMotifPromotionCertificate,
  type KpVerifiedExecutableMotifPromotionCertificate
} from "../architecture/executable-motif-promotion-evidence.ts";
import {
  isKpVerifiedExactFractionQuantityReleaseApproval,
  kpVerifiedExactFractionQuantityReleaseApproval,
  type KpVerifiedExactFractionQuantityReleaseApproval
} from "../architecture/exact-fraction-quantity-release-approval.ts";
import {
  isKpVerifiedPlaceValueAdditionPromotionReadiness,
  type KpVerifiedPlaceValueAdditionPromotionReadiness
} from "../architecture/place-value-addition-promotion-certificate.ts";
import {
  isKpVerifiedPlaceValueAdditionReleaseApproval,
  kpVerifiedPlaceValueAdditionReleaseApproval,
  type KpVerifiedPlaceValueAdditionReleaseApproval
} from "../architecture/place-value-addition-release-approval.ts";
import {
  isKpVerifiedCrossDomainSynchronizedModelReleaseApproval,
  kpVerifiedEconomicsEquilibriumReleaseApproval,
  kpVerifiedPhysicsWorkEnergyReleaseApproval,
  type KpVerifiedCrossDomainSynchronizedModelReleaseApproval
} from "../architecture/cross-domain-synchronized-model-release-approval.ts";
import {
  isKpVerifiedVectorDotProjectionReleaseApproval,
  kpVerifiedVectorDotProjectionReleaseApproval,
  type KpVerifiedVectorDotProjectionReleaseApproval
} from "../architecture/vector-dot-projection-release-approval.ts";
import {
  isKpVerifiedContributorFusionReleaseApproval,
  kpContributorFusionReleasedAnimationIds,
  kpVerifiedContributorFusionReleaseApproval,
  type KpVerifiedContributorFusionReleaseApproval
} from "../architecture/contributor-fusion-release-approval.ts";
import {
  isKpVerifiedCarrierPreservingSimplificationReleaseApproval,
  kpCarrierPreservingSimplificationReleasedAnimationIds,
  kpVerifiedCarrierPreservingSimplificationReleaseApproval,
  type KpVerifiedCarrierPreservingSimplificationReleaseApproval
} from "../architecture/carrier-preserving-simplification-release-approval.ts";

export type KpAnimationLibraryDisplayRepresentationKind =
  | "reader"
  | "editor"
  | "card"
  | "concept-room"
  | "diagnostic"
  | "static"
  | "export";

export interface KpAnimationLibraryDisplayRepresentation {
  readonly id: string;
  readonly label: string;
  readonly kind: KpAnimationLibraryDisplayRepresentationKind;
  readonly href: string;
  readonly role: "canonical-host" | "projection" | "diagnostic";
}

export interface KpAnimationLibraryDisplayEntry {
  readonly animationId: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly availability: "playable" | "planned";
  readonly canonicalFormat: "ported" | "partial" | "legacy";
  readonly featured: boolean;
  readonly primaryRepresentationId?: string | undefined;
  readonly representations: readonly KpAnimationLibraryDisplayRepresentation[];
}

const featuredAnimationIds = [
  "animation.operation-evaluation.one-plus-two",
  "animation.generated.radical.square-root-as-power",
  "animation.numerator-split-merge.round-trip",
  "animation.linear-solve.solve-x",
  "animation.generated.distribution.expand-a-sum",
  "animation.derivative-rules.tangent-graph"
] as const;

export interface KpCanonicalFormatPromotionEvidence {
  readonly animationId: string;
  readonly executionAuthority:
    | {
        readonly kind: "legacy-reviewed";
        readonly reviewId: string;
      }
    | {
        readonly kind: "executable-motif";
        readonly certificate?:
          KpVerifiedExecutableMotifPromotionCertificate | undefined;
      }
    | {
        readonly kind: "executable-motif-cohort";
        readonly approval?:
          KpVerifiedExactFractionQuantityReleaseApproval | undefined;
      }
    | {
        readonly kind: "place-value-pre-release";
        readonly certificate?:
          KpVerifiedPlaceValueAdditionPromotionReadiness | undefined;
      }
    | {
        readonly kind: "place-value-release";
        readonly approval?:
          KpVerifiedPlaceValueAdditionReleaseApproval | undefined;
      }
    | {
        readonly kind: "cross-domain-synchronized-model-release";
        readonly approval?:
          KpVerifiedCrossDomainSynchronizedModelReleaseApproval | undefined;
      }
    | {
        readonly kind: "vector-dot-projection-release";
        readonly approval?:
          KpVerifiedVectorDotProjectionReleaseApproval | undefined;
      }
    | {
        readonly kind: "contributor-fusion-release";
        readonly approval?:
          KpVerifiedContributorFusionReleaseApproval | undefined;
      }
    | {
        readonly kind: "carrier-preserving-simplification-release";
        readonly approval?:
          KpVerifiedCarrierPreservingSimplificationReleaseApproval | undefined;
      };
  readonly exclusiveCanonicalPaint: boolean;
  readonly requiredMotifParity: boolean;
  readonly responsiveRuntimeGates: boolean;
  readonly humanReviewApproved: boolean;
  readonly compatibilityPaintRetired: boolean;
  readonly releaseGatePassed: boolean;
  readonly presentationCoverage: KpAnimatedPresentationCoverage;
  readonly evidenceSourceIds: readonly string[];
}

// These entries were promoted under reviewed contracts that predate executable
// motif programs. The allowlist freezes that historical exception; new entries
// cannot claim the same authority merely by copying the public evidence shape.
const legacyReviewedCanonicalFormatAnimationIds = new Set([
  "animation.generated.radical.square-root-as-power",
  "animation.numerator-split-merge.round-trip",
  "animation.fraction-composition.two-thirds-solve"
]);

const canonicalFormatPromotionEvidenceByAnimationId = new Map<string,
  KpCanonicalFormatPromotionEvidence>([
  [
    "animation.operation-evaluation.one-plus-two",
    {
      animationId: "animation.operation-evaluation.one-plus-two",
      executionAuthority: {
        kind: "executable-motif"
      },
      exclusiveCanonicalPaint: true,
      requiredMotifParity: true,
      responsiveRuntimeGates: false,
      humanReviewApproved: false,
      compatibilityPaintRetired: true,
      releaseGatePassed: false,
      presentationCoverage: "verified-animated",
      evidenceSourceIds: [
        "run-contract.kp.executable-motif-perceptual-continuity-repair-v0"
      ]
    }
  ],
  ...kpContributorFusionReleasedAnimationIds.map((animationId) => [
    animationId,
    completeContributorFusionCanonicalFormatEvidence({
      animationId,
      approval: kpVerifiedContributorFusionReleaseApproval
    })
  ] as const),
  ...kpCarrierPreservingSimplificationReleasedAnimationIds.map(
    (animationId) => [
      animationId,
      completeCarrierPreservingSimplificationCanonicalFormatEvidence({
        animationId,
        approval: kpVerifiedCarrierPreservingSimplificationReleaseApproval
      })
    ] as const
  ),
  [
    "animation.exact-fraction-quantity.third-plus-sixth",
    completeExactFractionQuantityCanonicalFormatEvidence(
      kpVerifiedExactFractionQuantityReleaseApproval
    )
  ],
  [
    "animation.place-value-addition.278-plus-156",
    completePlaceValueAdditionCanonicalFormatEvidence(
      kpVerifiedPlaceValueAdditionReleaseApproval
    )
  ],
  [
    "animation.economics.supply-demand-equilibrium-shift",
    completeCrossDomainSynchronizedModelCanonicalFormatEvidence(
      kpVerifiedEconomicsEquilibriumReleaseApproval
    )
  ],
  [
    "animation.physics.constant-force-work-energy",
    completeCrossDomainSynchronizedModelCanonicalFormatEvidence(
      kpVerifiedPhysicsWorkEnergyReleaseApproval
    )
  ],
  [
    "animation.dot-projection.basic",
    completeVectorDotProjectionCanonicalFormatEvidence(
      kpVerifiedVectorDotProjectionReleaseApproval
    )
  ],
  [
    "animation.generated.radical.square-root-as-power",
    completeCanonicalFormatEvidence(
      "animation.generated.radical.square-root-as-power",
      [
        "review.kp.radical-reader-promotion-kit-closeout",
        "decision.kp.endpoint-paint-font-continuity"
      ]
    )
  ],
  [
    "animation.numerator-split-merge.round-trip",
    completeCanonicalFormatEvidence(
      "animation.numerator-split-merge.round-trip",
      ["review.kp.glyph-compositor-promotion"]
    )
  ],
  [
    "animation.foldable-distribution.collect-like-terms",
    {
      animationId:
        "animation.foldable-distribution.collect-like-terms",
      executionAuthority: {
        kind: "legacy-reviewed",
        reviewId:
          "run-contract.kp.foldable-distribution-collection-v1"
      },
      exclusiveCanonicalPaint: true,
      requiredMotifParity: false,
      responsiveRuntimeGates: true,
      humanReviewApproved: false,
      compatibilityPaintRetired: false,
      releaseGatePassed: false,
      presentationCoverage: "incomplete",
      evidenceSourceIds: [
        "run-contract.kp.foldable-distribution-collection-v1"
      ]
    }
  ],
  [
    "animation.fraction-composition.two-thirds-solve",
    completeFractionCompositionCanonicalFormatEvidence(
      kpVerifiedFractionCompositionReleaseApproval
    )
  ],
  [
    "animation.linear-solve.solve-x",
    {
      animationId: "animation.linear-solve.solve-x",
      executionAuthority: {
        kind: "legacy-reviewed",
        reviewId: "review.kp.canonical-equation-renderer-convergence"
      },
      exclusiveCanonicalPaint: true,
      requiredMotifParity: false,
      responsiveRuntimeGates: true,
      humanReviewApproved: true,
      compatibilityPaintRetired: false,
      releaseGatePassed: false,
      presentationCoverage: "verified-animated",
      evidenceSourceIds: [
        "review.kp.canonical-equation-renderer-convergence"
      ]
    }
  ]
]);

const supplementalRepresentations = [
  {
    animationId: "animation.economics.supply-demand-equilibrium-shift",
    id: "library.tutorial.economics-demand-shift",
    label: "Demand shift tutorial",
    kind: "reader",
    href: "/tutorials/economics/demand-shift/",
    role: "canonical-host"
  },
  {
    animationId: "animation.operation-evaluation.one-plus-two",
    id: "library.editor.operation-evaluation-focused-host",
    label: "Animation + lesson",
    kind: "editor",
    href:
      "/?view=animation-library-host&animation=" +
      "editor-animation.animation.operation-evaluation.one-plus-two",
    role: "canonical-host"
  },
  {
    animationId: "animation.operation-evaluation.two-times-three",
    id: "library.editor.contributor-fusion.two-times-three",
    label: "Contributor fusion: product",
    kind: "editor",
    href:
      "/?view=animation-library-host&animation=" +
      "editor-animation.animation.operation-evaluation.two-times-three",
    role: "canonical-host"
  },
  {
    animationId: "animation.operation-evaluation.three-sixths",
    id: "library.editor.contributor-fusion.three-sixths",
    label: "Contributor fusion: quotient",
    kind: "editor",
    href:
      "/?view=animation-library-host&animation=" +
      "editor-animation.animation.operation-evaluation.three-sixths",
    role: "canonical-host"
  },
  {
    animationId: "animation.operation-evaluation.five-plus-two",
    id: "library.editor.contributor-fusion.five-plus-two",
    label: "Contributor fusion: sum",
    kind: "editor",
    href:
      "/?view=animation-library-host&animation=" +
      "editor-animation.animation.operation-evaluation.five-plus-two",
    role: "canonical-host"
  },
  {
    animationId: "animation.place-value-addition.278-plus-156",
    id: "library.editor.place-value-addition-focused-host",
    label: "Animation + lesson",
    kind: "editor",
    href:
      "/?view=animation-library-host&animation=" +
      "editor-animation.animation.place-value-addition.278-plus-156",
    role: "canonical-host"
  },
  {
    animationId: "animation.generated.radical.square-root-as-power",
    id: "library.reader.radical-succession",
    label: "Reader integration",
    kind: "reader",
    href: "/reader/radical-succession/",
    role: "canonical-host"
  },
  {
    animationId: "animation.generated.radical.square-root-as-power",
    id: "library.diagnostic.radical-reconciliation",
    label: "Glyph diagnostics",
    kind: "diagnostic",
    href:
      "/glyph-reconciliation-experiment.html" +
      "?radicalInventory=1&reviewGallery=radical&progress=500",
    role: "diagnostic"
  },
  {
    animationId: "animation.numerator-split-merge.round-trip",
    id: "library.diagnostic.fraction-reconciliation",
    label: "Fraction diagnostics",
    kind: "diagnostic",
    href:
      "/glyph-reconciliation-experiment.html" +
      "?fractionDirection=split&reviewGallery=fraction&progress=500" +
      "#glyph-fraction-exemplar",
    role: "diagnostic"
  },
  {
    animationId: "animation.linear-solve.solve-x",
    id: "library.diagnostic.solve-x-reconciliation",
    label: "Solve-x diagnostics",
    kind: "diagnostic",
    href: "/glyph-reconciliation-experiment.html?progress=500#glyph-experiment",
    role: "diagnostic"
  },
  {
    animationId: "animation.generated.linear-solve.linear-68c15d41",
    id: "library.reader.generated-linear-solve",
    label: "Reader integration",
    kind: "reader",
    href: "/reader/generated-solve-x/",
    role: "canonical-host"
  },
  {
    animationId: "animation.programming.scheme-factorial",
    id: "library.reader.scheme-factorial-tutorial",
    label: "Scheme factorial tutorial",
    kind: "reader",
    href: "/tutorials/programming/scheme-factorial/",
    role: "projection"
  }
] as const satisfies readonly (
  KpAnimationLibraryDisplayRepresentation & { readonly animationId: string }
)[];

const preferredRepresentationByAnimation = new Map<string, string>([
  [
    "animation.operation-evaluation.one-plus-two",
    "library.editor.operation-evaluation-focused-host"
  ],
  [
    "animation.operation-evaluation.two-times-three",
    "library.editor.contributor-fusion.two-times-three"
  ],
  [
    "animation.operation-evaluation.three-sixths",
    "library.editor.contributor-fusion.three-sixths"
  ],
  [
    "animation.operation-evaluation.five-plus-two",
    "library.editor.contributor-fusion.five-plus-two"
  ],
  [
    "animation.place-value-addition.278-plus-156",
    "library.editor.place-value-addition-focused-host"
  ],
  [
    "animation.generated.radical.square-root-as-power",
    "library.reader.radical-succession"
  ],
  [
    "animation.numerator-split-merge.round-trip",
    "learner-experience.numerator-split-merge-scroll-lesson." +
      "animation.numerator-split-merge.round-trip"
  ]
]);

export function createKpAnimationLibraryDisplayCatalog():
  readonly KpAnimationLibraryDisplayEntry[] {
  const workbench = createKpSemanticAnimationWorkbenchIndex();
  const experiences = createKpLearnerExperienceLibrary();
  const entries = new Map<string, MutableDisplayEntry>();

  for (const entry of workbench.entries) {
    entries.set(entry.identity.animationId, fromWorkbenchEntry(entry));
  }
  for (const experience of experiences) {
    mergeLearnerExperience(entries, experience);
  }
  for (const supplemental of supplementalRepresentations) {
    const entry = entries.get(supplemental.animationId);
    if (entry === undefined) {
      throw new Error(
        `Display host ${supplemental.id} references unknown animation ` +
        supplemental.animationId
      );
    }
    const { animationId: _animationId, ...representation } = supplemental;
    addRepresentation(entry, representation);
  }

  return [...entries.values()]
    .map(finalizeEntry)
    .sort((left, right) =>
      Number(right.featured) - Number(left.featured) ||
      left.title.localeCompare(right.title)
    );
}

interface MutableDisplayEntry {
  readonly animationId: string;
  readonly title: string;
  readonly summary: string;
  readonly tags: Set<string>;
  availability: "playable" | "planned";
  readonly representations: KpAnimationLibraryDisplayRepresentation[];
}

function fromWorkbenchEntry(
  entry: KpSemanticAnimationWorkbenchIndexEntry
): MutableDisplayEntry {
  return {
    animationId: entry.identity.animationId,
    title: entry.identity.title,
    summary: entry.summary,
    tags: new Set(entry.tags),
    availability:
      entry.lifecycle.playability === "playable" ? "playable" : "planned",
    representations: entry.representations.flatMap((representation) =>
      fromWorkbenchRepresentation(representation)
    )
  };
}

function fromWorkbenchRepresentation(
  representation: KpAnimationRepresentationRelationship
): readonly KpAnimationLibraryDisplayRepresentation[] {
  if (representation.href === undefined) return [];
  return [{
    id: representation.representationId,
    label: representation.label,
    kind: representation.kind === "lesson"
      ? "reader"
      : representation.kind,
    href: representation.href,
    role:
      representation.presentationRole === "canonical"
        ? "canonical-host"
        : "projection"
  }];
}

function mergeLearnerExperience(
  entries: Map<string, MutableDisplayEntry>,
  experience: KpLearnerExperienceDescriptor
): void {
  for (const presentation of experience.animationPresentations) {
    const animationId = presentation.canonicalAnimationId;
    let entry = entries.get(animationId);
    if (entry === undefined) {
      entry = {
        animationId,
        title: experience.title,
        summary: experience.summary,
        tags: new Set([
          experience.kind,
          experience.status,
          "reader-only"
        ]),
        availability: "playable",
        representations: []
      };
      entries.set(animationId, entry);
    } else {
      entry.tags.add(experience.kind);
      entry.tags.add(experience.status);
      entry.availability = "playable";
    }
    addRepresentation(entry, {
      id:
        `learner-experience.${experience.id}.${presentation.assetId}`,
      label: experience.title,
      kind: experience.kind === "scroll-lesson"
        ? "reader"
        : "concept-room",
      href: experience.href,
      role: "canonical-host"
    });
  }
}

function addRepresentation(
  entry: MutableDisplayEntry,
  representation: KpAnimationLibraryDisplayRepresentation
): void {
  if (
    entry.representations.some(
      (candidate) => candidate.id === representation.id
    )
  ) {
    return;
  }
  entry.representations.push(representation);
}

function finalizeEntry(
  entry: MutableDisplayEntry
): KpAnimationLibraryDisplayEntry {
  const preferredId =
    preferredRepresentationByAnimation.get(entry.animationId) ??
    entry.representations.find(
      (representation) => representation.role === "canonical-host"
    )?.id ??
    entry.representations[0]?.id;
  const representations = entry.representations
    .map((representation) => ({
      ...representation,
      role:
        representation.role === "diagnostic"
          ? "diagnostic" as const
          : representation.id === preferredId
            ? "canonical-host" as const
            : "projection" as const
    }))
    .sort((left, right) =>
      representationRank(left) - representationRank(right) ||
      left.label.localeCompare(right.label)
    );
  return {
    animationId: entry.animationId,
    title: entry.title,
    summary: entry.summary,
    tags: [...entry.tags].sort(),
    availability: entry.availability,
    canonicalFormat: deriveKpCanonicalFormatStatus({
      evidence:
        canonicalFormatPromotionEvidenceByAnimationId.get(entry.animationId),
      representations
    }),
    featured: (featuredAnimationIds as readonly string[]).includes(
      entry.animationId
    ),
    ...(preferredId === undefined
      ? {}
      : { primaryRepresentationId: preferredId }),
    representations
  };
}

export function deriveKpCanonicalFormatStatus(input: {
  readonly evidence?: KpCanonicalFormatPromotionEvidence | undefined;
  readonly representations:
    readonly KpAnimationLibraryDisplayRepresentation[];
}): KpAnimationLibraryDisplayEntry["canonicalFormat"] {
  if (input.evidence === undefined) return "legacy";
  const hasCanonicalHost = input.representations.some(
    ({ role }) => role === "canonical-host"
  );
  const passed =
    hasCanonicalHost &&
    hasKpCanonicalFormatExecutionAuthority(input.evidence) &&
    input.evidence.evidenceSourceIds.length > 0 &&
    input.evidence.exclusiveCanonicalPaint &&
    input.evidence.requiredMotifParity &&
    input.evidence.responsiveRuntimeGates &&
    input.evidence.humanReviewApproved &&
    input.evidence.compatibilityPaintRetired &&
    input.evidence.releaseGatePassed &&
    input.evidence.presentationCoverage === "verified-animated";
  return passed ? "ported" : "partial";
}

function completeCanonicalFormatEvidence(
  animationId: string,
  evidenceSourceIds: readonly string[]
): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId,
    executionAuthority: Object.freeze({
      kind: "legacy-reviewed" as const,
      reviewId: evidenceSourceIds[0] ?? ""
    }),
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: true,
    presentationCoverage: "verified-animated",
    evidenceSourceIds: Object.freeze([...evidenceSourceIds])
  });
}

function hasKpCanonicalFormatExecutionAuthority(
  evidence: KpCanonicalFormatPromotionEvidence
): boolean {
  switch (evidence.executionAuthority.kind) {
    case "legacy-reviewed":
      return (
        legacyReviewedCanonicalFormatAnimationIds.has(evidence.animationId) &&
        evidence.executionAuthority.reviewId.trim().length > 0 &&
        evidence.evidenceSourceIds.includes(
          evidence.executionAuthority.reviewId
        )
      );
    case "executable-motif": {
      const certificate = evidence.executionAuthority.certificate;
      return (
        isKpVerifiedExecutableMotifPromotionCertificate(certificate) &&
        certificate.animationId === evidence.animationId
      );
    }
    case "executable-motif-cohort": {
      const approval = evidence.executionAuthority.approval;
      return (
        isKpVerifiedExactFractionQuantityReleaseApproval(approval) &&
        approval.animationId === evidence.animationId &&
        approval.executableMotifCertificates.length === 3 &&
        new Set(
          approval.executableMotifCertificates.map(
            ({ programKind }) => programKind
          )
        ).size === 3 &&
        approval.executableMotifCertificates.every((certificate) =>
          isKpVerifiedExecutableMotifPromotionCertificate(certificate) &&
          certificate.animationId === evidence.animationId
        )
      );
    }
    case "place-value-pre-release": {
      const certificate = evidence.executionAuthority.certificate;
      return (
        isKpVerifiedPlaceValueAdditionPromotionReadiness(certificate) &&
        certificate.animationId === evidence.animationId &&
        certificate.status === "ready-for-human-review"
      );
    }
    case "place-value-release": {
      const approval = evidence.executionAuthority.approval;
      return (
        isKpVerifiedPlaceValueAdditionReleaseApproval(approval) &&
        approval.animationId === evidence.animationId &&
        approval.releaseDecision === "passed" &&
        approval.promotedPositionCount === 3 &&
        isKpVerifiedPlaceValueAdditionPromotionReadiness(approval.readiness)
      );
    }
    case "cross-domain-synchronized-model-release": {
      const approval = evidence.executionAuthority.approval;
      return (
        isKpVerifiedCrossDomainSynchronizedModelReleaseApproval(approval) &&
        approval.animationId === evidence.animationId &&
        approval.releaseDecision === "passed" &&
        approval.sharedContractCount === 4
      );
    }
    case "vector-dot-projection-release": {
      const approval = evidence.executionAuthority.approval;
      return (
        isKpVerifiedVectorDotProjectionReleaseApproval(approval) &&
        approval.animationId === evidence.animationId &&
        approval.releaseDecision === "passed" &&
        approval.checkpointCount === 7
      );
    }
    case "contributor-fusion-release": {
      const approval = evidence.executionAuthority.approval;
      return (
        isKpVerifiedContributorFusionReleaseApproval(approval) &&
        approval.releaseDecision === "passed" &&
        approval.animationIds.includes(
          evidence.animationId as typeof approval.animationIds[number]
        ) &&
        approval.approvedPressureKinds.length === 2 &&
        approval.confirmationKind === "sum"
      );
    }
    case "carrier-preserving-simplification-release": {
      const approval = evidence.executionAuthority.approval;
      return (
        isKpVerifiedCarrierPreservingSimplificationReleaseApproval(approval) &&
        approval.releaseDecision === "passed" &&
        approval.animationIds.includes(
          evidence.animationId as typeof approval.animationIds[number]
        ) &&
        approval.approvedTransformationKinds.length === 2
      );
    }
  }
}

function completeCarrierPreservingSimplificationCanonicalFormatEvidence(input: {
  readonly animationId:
    KpVerifiedCarrierPreservingSimplificationReleaseApproval["animationIds"][number];
  readonly approval: KpVerifiedCarrierPreservingSimplificationReleaseApproval;
}): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId: input.animationId,
    executionAuthority: Object.freeze({
      kind: "carrier-preserving-simplification-release" as const,
      approval: input.approval
    }),
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: input.approval.releaseDecision === "passed",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: input.approval.evidenceSourceIds
  });
}

function completeContributorFusionCanonicalFormatEvidence(input: {
  readonly animationId: KpVerifiedContributorFusionReleaseApproval[
    "animationIds"
  ][number];
  readonly approval: KpVerifiedContributorFusionReleaseApproval;
}): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId: input.animationId,
    executionAuthority: Object.freeze({
      kind: "contributor-fusion-release" as const,
      approval: input.approval
    }),
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: input.approval.releaseDecision === "passed",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: input.approval.evidenceSourceIds
  });
}

function completeCrossDomainSynchronizedModelCanonicalFormatEvidence(
  approval: KpVerifiedCrossDomainSynchronizedModelReleaseApproval
): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId: approval.animationId,
    executionAuthority: Object.freeze({
      kind: "cross-domain-synchronized-model-release" as const,
      approval
    }),
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: true,
    presentationCoverage: "verified-animated",
    evidenceSourceIds: approval.evidenceSourceIds
  });
}

function completeVectorDotProjectionCanonicalFormatEvidence(
  approval: KpVerifiedVectorDotProjectionReleaseApproval
): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId: approval.animationId,
    executionAuthority: Object.freeze({
      kind: "vector-dot-projection-release" as const,
      approval
    }),
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: approval.releaseDecision === "passed",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: approval.evidenceSourceIds
  });
}

function completeFractionCompositionCanonicalFormatEvidence(
  approval: KpVerifiedFractionCompositionReleaseApproval
): KpCanonicalFormatPromotionEvidence {
  return completeCanonicalFormatEvidence(
    approval.animationId,
    approval.evidenceSourceIds
  );
}

function completeExactFractionQuantityCanonicalFormatEvidence(
  approval: KpVerifiedExactFractionQuantityReleaseApproval
): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId: approval.animationId,
    executionAuthority: Object.freeze({
      kind: "executable-motif-cohort" as const,
      approval
    }),
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: approval.releaseDecision === "passed",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: approval.evidenceSourceIds
  });
}

function completePlaceValueAdditionCanonicalFormatEvidence(
  approval: KpVerifiedPlaceValueAdditionReleaseApproval
): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId: approval.animationId,
    executionAuthority: Object.freeze({
      kind: "place-value-release" as const,
      approval
    }),
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: approval.releaseDecision === "passed",
    presentationCoverage: "verified-animated",
    evidenceSourceIds: approval.evidenceSourceIds
  });
}

function representationRank(
  representation: KpAnimationLibraryDisplayRepresentation
): number {
  if (representation.role === "canonical-host") return 0;
  if (representation.role === "projection") return 1;
  return 2;
}
