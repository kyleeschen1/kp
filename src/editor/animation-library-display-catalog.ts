import {
  createKpLearnerExperienceLibrary,
  type KpLearnerExperienceDescriptor
} from "./learner-experience-library.ts";
import {
  createKpSemanticAnimationWorkbenchIndex
} from "./semantic-animation-workbench-data.ts";
import type {
  KpSemanticAnimationWorkbenchIndexEntry
} from "./semantic-animation-workbench-index.ts";
import type {
  KpAnimationRepresentationRelationship
} from "./semantic-animation-workbench-representation.ts";

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
  "animation.generated.radical.square-root-as-power",
  "animation.numerator-split-merge.round-trip",
  "animation.linear-solve.solve-x",
  "animation.generated.distribution.expand-a-sum",
  "animation.derivative-rules.tangent-graph"
] as const;

export interface KpCanonicalFormatPromotionEvidence {
  readonly animationId: string;
  readonly exclusiveCanonicalPaint: boolean;
  readonly requiredMotifParity: boolean;
  readonly responsiveRuntimeGates: boolean;
  readonly humanReviewApproved: boolean;
  readonly compatibilityPaintRetired: boolean;
  readonly releaseGatePassed: boolean;
  readonly evidenceSourceIds: readonly string[];
}

const canonicalFormatPromotionEvidenceByAnimationId = new Map<string,
  KpCanonicalFormatPromotionEvidence>([
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
      exclusiveCanonicalPaint: true,
      requiredMotifParity: false,
      responsiveRuntimeGates: true,
      humanReviewApproved: false,
      compatibilityPaintRetired: false,
      releaseGatePassed: false,
      evidenceSourceIds: [
        "run-contract.kp.foldable-distribution-collection-v1"
      ]
    }
  ],
  [
    "animation.fraction-composition.two-thirds-solve",
    {
      animationId: "animation.fraction-composition.two-thirds-solve",
      exclusiveCanonicalPaint: true,
      requiredMotifParity: true,
      responsiveRuntimeGates: true,
      humanReviewApproved: false,
      compatibilityPaintRetired: true,
      releaseGatePassed: false,
      evidenceSourceIds: [
        "run-contract.kp.canonical-fraction-composition-promotion-v1"
      ]
    }
  ],
  [
    "animation.linear-solve.solve-x",
    {
      animationId: "animation.linear-solve.solve-x",
      exclusiveCanonicalPaint: true,
      requiredMotifParity: false,
      responsiveRuntimeGates: true,
      humanReviewApproved: true,
      compatibilityPaintRetired: false,
      releaseGatePassed: false,
      evidenceSourceIds: [
        "review.kp.canonical-equation-renderer-convergence"
      ]
    }
  ]
]);

const supplementalRepresentations = [
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
  }
] as const satisfies readonly (
  KpAnimationLibraryDisplayRepresentation & { readonly animationId: string }
)[];

const preferredRepresentationByAnimation = new Map<string, string>([
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
    input.evidence.evidenceSourceIds.length > 0 &&
    input.evidence.exclusiveCanonicalPaint &&
    input.evidence.requiredMotifParity &&
    input.evidence.responsiveRuntimeGates &&
    input.evidence.humanReviewApproved &&
    input.evidence.compatibilityPaintRetired &&
    input.evidence.releaseGatePassed;
  return passed ? "ported" : "partial";
}

function completeCanonicalFormatEvidence(
  animationId: string,
  evidenceSourceIds: readonly string[]
): KpCanonicalFormatPromotionEvidence {
  return Object.freeze({
    animationId,
    exclusiveCanonicalPaint: true,
    requiredMotifParity: true,
    responsiveRuntimeGates: true,
    humanReviewApproved: true,
    compatibilityPaintRetired: true,
    releaseGatePassed: true,
    evidenceSourceIds: Object.freeze([...evidenceSourceIds])
  });
}

function representationRank(
  representation: KpAnimationLibraryDisplayRepresentation
): number {
  if (representation.role === "canonical-host") return 0;
  if (representation.role === "projection") return 1;
  return 2;
}
