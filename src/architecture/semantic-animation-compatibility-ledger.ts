export type KpSemanticAnimationCompatibilityCategory =
  | "correspondence"
  | "fallback"
  | "transformation-ref"
  | "intent"
  | "timeline"
  | "operation-resolution"
  | "projection"
  | "registry";

export type KpSemanticAnimationCompatibilityStatus =
  | "canonical"
  | "compatibility-only"
  | "retirement-candidate"
  | "retained-fixture";

export type KpCompatibilityClosureEvidenceKind =
  | "reference"
  | "replacement"
  | "fixture"
  | "route"
  | "review"
  | "export";

export interface KpCompatibilitySourceReference {
  readonly path: `src/${string}.ts`;
  readonly evidence: string;
}

export interface KpCompatibilitySunsetEvidence {
  readonly path: `tests/${string}.test.ts`;
  readonly evidence: string;
}

export interface KpSemanticAnimationCompatibilityLedgerEntry {
  readonly id: string;
  readonly category: KpSemanticAnimationCompatibilityCategory;
  readonly contractKey?: string | undefined;
  readonly owner: KpCompatibilitySourceReference;
  readonly authors: readonly KpCompatibilitySourceReference[];
  readonly consumers: readonly KpCompatibilitySourceReference[];
  readonly replacementEvidence: readonly KpCompatibilitySourceReference[];
  readonly status: KpSemanticAnimationCompatibilityStatus;
  readonly sunsetEvidence: readonly KpCompatibilitySunsetEvidence[];
  readonly requiredClosureEvidence:
    readonly KpCompatibilityClosureEvidenceKind[];
  readonly retirementCondition: string;
}

export const kpSemanticAnimationCompatibilityLedger = [
  compatibility({
    id: "compatibility.selector-pair-correspondence",
    category: "correspondence",
    owner: reference(
      "src/semantic/asset-transformation.ts",
      "KpSelectorCorrespondence"
    ),
    consumers: [
      reference("src/animation/runtime-sampler.ts", "transformation.correspondence"),
      reference("src/animation/visual-frame-laws.ts", "transformation.correspondence")
    ],
    replacementEvidence: [
      reference("src/semantic/correspondence.ts", "CorrespondenceMap")
    ],
    status: "compatibility-only",
    sunsetEvidence: [
      sunsetEvidence(
        "tests/correspondence-composition.test.ts",
        "correspondence"
      )
    ],
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: "Every consumer derives pair views from rich correspondence maps."
  }),
  compatibility({
    id: "compatibility.typed-gap-to-legacy-fade",
    category: "fallback",
    owner: reference(
      "src/semantic/semantic-transition-gap.ts",
      "adaptKpSemanticTransitionGapToLegacyFade"
    ),
    consumers: [
      reference(
        "src/domain-ir/semantic-equation-transition-compiler.ts",
        "legacy-fade"
      )
    ],
    replacementEvidence: [
      reference(
        "src/semantic/semantic-transition-gap.ts",
        "KpSemanticTransitionGap"
      )
    ],
    status: "compatibility-only",
    sunsetEvidence: [
      sunsetEvidence(
        "tests/semantic-equation-transition-compiler.test.ts",
        "fallback"
      )
    ],
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: "All supported transitions compile semantically and legacy policy has no callers."
  }),
  compatibility({
    id: "compatibility.lightweight-transformation-ref",
    category: "transformation-ref",
    owner: reference(
      "src/semantic/animation.ts",
      "SemanticTransformationRef"
    ),
    consumers: [
      reference("src/animation/asset.ts", "transformationRefs"),
      reference("src/animation/runtime-sampler.ts", "transformationRefs")
    ],
    replacementEvidence: [
      reference(
        "src/semantic/asset-transformation.ts",
        "KpSemanticTransformation"
      )
    ],
    status: "compatibility-only",
    sunsetEvidence: [
      sunsetEvidence(
        "tests/kp-animation-runtime-sampler.test.ts",
        "activeTransformationIds"
      )
    ],
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: "The canonical sampled-frame projection produces this view from rich transformations."
  }),
  compatibility({
    id: "compatibility.saddle-animation-intent",
    category: "intent",
    owner: reference(
      "src/semantic/animation.ts",
      "SaddleDenominatorAnimationIntent"
    ),
    consumers: [
      reference(
        "src/animation/tween.ts",
        "sampleSaddleDenominatorAnimationFrames"
      )
    ],
    replacementEvidence: [
      reference("src/animation/graph-adapter.ts", "createGraphAnimationAssets")
    ],
    status: "retained-fixture",
    sunsetEvidence: [
      sunsetEvidence("tests/tween.test.ts", "SaddleDenominator")
    ],
    requiredClosureEvidence: ["reference", "fixture"],
    retirementCondition: "A graph-domain replacement exists and the semantic fixture is migrated."
  }),
  compatibility({
    id: "compatibility.timeline-vocabularies",
    category: "timeline",
    owner: reference("src/animation/runtime-sampler.ts", "KpAnimationRuntimeClock"),
    authors: [
      reference("src/semantic/asset-timeline.ts", "KpTimelineSpec"),
      reference("src/animation/asset.ts", "KpAnimationAssetTimeline"),
      reference("src/animation/choreography-timeline.ts", "KpChoreographyTimeline")
    ],
    consumers: [
      reference("src/animation/frame-descriptor.ts", "timelineId"),
      reference("src/rendering/equation-motion-sampler.ts", "SemanticBeatTimeline")
    ],
    replacementEvidence: [
      reference("src/animation/runtime-sampler.ts", "KpAnimationRuntimeClock")
    ],
    status: "compatibility-only",
    sunsetEvidence: [
      sunsetEvidence(
        "tests/sampled-frame-envelope.test.ts",
        "clock"
      )
    ],
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: "All timeline vocabularies compile to one clock without losing authored beats."
  }),
  compatibility({
    id: "compatibility.generated-fixture-resolution",
    category: "operation-resolution",
    owner: reference(
      "src/semantic/canonical-operation-registry.ts",
      "kpCanonicalOperationRegistry"
    ),
    authors: [
      reference(
        "src/semantic/generated-algebra-fixture-registry.ts",
        "GeneratedAlgebraTutorialFixtureSpec"
      )
    ],
    consumers: [
      reference(
        "src/animation/llm-animation-draft-v2.ts",
        "resolveKpCanonicalOperation"
      )
    ],
    replacementEvidence: [
      reference(
        "src/semantic/canonical-operation-registry.ts",
        "resolveKpCanonicalOperation"
      )
    ],
    status: "retained-fixture",
    sunsetEvidence: [
      sunsetEvidence(
        "tests/kp-animation-generated-problem-import.test.ts",
        "fixture"
      )
    ],
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: "Generated fixtures bind through canonical operation pins with fixture parity."
  }),
  compatibility({
    id: "compatibility.cross-surface-animation-projections",
    category: "projection",
    owner: reference(
      "src/editor/semantic-animation-workbench-representation-adapter.ts",
      "canonicalAnimationId"
    ),
    authors: [
      reference(
        "src/animation/flashcard-projection.ts",
        "createKpAnimationFlashcardProjection"
      )
    ],
    consumers: [
      reference("src/editor/editor.ts", "canonicalLesson"),
      reference(
        "src/editor/semantic-animation-workbench-shell.ts",
        "canonicalRepresentation"
      )
    ],
    replacementEvidence: [
      reference("src/animation/asset-projections.ts", "projectKpAnimationAsset")
    ],
    status: "canonical",
    sunsetEvidence: [
      sunsetEvidence(
        "tests/product-consumer-projections.test.ts",
        "lesson-first"
      )
    ],
    requiredClosureEvidence: [
      "reference",
      "replacement",
      "route",
      "review",
      "export",
      "fixture"
    ],
    retirementCondition: "Lesson, card, Workbench, review, route, and export consumers use narrow projections."
  }),
] as const satisfies readonly KpSemanticAnimationCompatibilityLedgerEntry[];

export const kpRetiredSemanticAnimationCompatibilityPaths = [
  ...[
    "equationMotionPresentationRecipe",
    "equationNativeHandoffRecipe",
    "equationCancellationPresentationRecipe",
    "equationZeroWitnessPresentationRecipe",
    "equationSuccessorPresentationRecipe",
    "equationDepthPresentationRecipe",
    "equationContinuantPresentationRecipe",
    "equationBranchPresentationStrategy",
    "equationCancellationTeachingGoal"
  ].map((formerContractKey) => ({
    id: `compatibility.metadata.${formerContractKey}`,
    formerContractKey,
    removedFrom: [
      "src/animation/equation-presentation-profile-decoder.ts",
      "src/semantic/cancellation-presentation-authoring.ts",
      "src/rendering/cancellation-presentation-conformance.ts"
    ],
    replacement:
      "Typed kp.presentation-profile.v1 on every equation-target asset.",
    closureTest:
      "tests/equation-presentation-profile-authoring-ratchet.test.ts"
  })),
  {
    id: "compatibility.rendering-motif-facades",
    formerContractKey: "rendering motif re-export facades",
    removedFrom: [
      "src/rendering/equation-visual-motif-defaults.ts",
      "src/rendering/executable-motif-grammar.ts",
      "src/rendering/visual-motif-composition.ts",
      "src/rendering/visual-motif.ts"
    ],
    replacement:
      "Typed canonical renderer-neutral vocabulary in src/animation/motifs/public-api.ts.",
    closureTest: "tests/neutral-animation-motif-boundary.test.ts"
  },
  {
    id: "compatibility.metadata.equationSequenceEnvelopeRecipe",
    formerContractKey: "equationSequenceEnvelopeRecipe",
    removedFrom: [
      "src/animation/divide-both-sides-equation-adapter.ts",
      "src/animation/numerator-split-merge-equation-adapter.ts"
    ],
    replacement:
      "Typed kp.equation-presentation-profile.v1 continuity policy.",
    closureTest:
      "tests/semantic-animation-compatibility-ledger.test.ts"
  },
  {
    id: "compatibility.metadata.equationFractionHierarchyRecipe",
    formerContractKey: "equationFractionHierarchyRecipe",
    removedFrom: [
      "src/animation/numerator-split-merge-equation-adapter.ts"
    ],
    replacement:
      "Typed kp.equation-presentation-profile.v1 depth and continuant policy.",
    closureTest:
      "tests/semantic-animation-compatibility-ledger.test.ts"
  },
  {
    id: "compatibility.module-scoped-choreography-registries",
    formerContractKey: "registeredRuntime",
    removedFrom: [
      "src/animation/fission-fusion-runtime.ts",
      "src/animation/distribution-choreography-runtime.ts",
      "src/animation/factoring-choreography-runtime.ts",
      "src/animation/canonical-reverse-runtime.ts"
    ],
    replacement:
      "Typed immutable algebra capabilities delivered by the lazy catalog pack.",
    closureTest: "tests/algebra-registration-graph.test.ts"
  }
] as const;

function compatibility(
  input: Omit<KpSemanticAnimationCompatibilityLedgerEntry, "authors"> & {
    readonly authors?: readonly KpCompatibilitySourceReference[] | undefined;
  }
): KpSemanticAnimationCompatibilityLedgerEntry {
  return { ...input, authors: input.authors ?? [] };
}

function reference(
  path: KpCompatibilitySourceReference["path"],
  evidence: string
): KpCompatibilitySourceReference {
  return { path, evidence };
}

function sunsetEvidence(
  path: KpCompatibilitySunsetEvidence["path"],
  evidence: string
): KpCompatibilitySunsetEvidence {
  return { path, evidence };
}
