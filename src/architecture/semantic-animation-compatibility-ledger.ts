export type KpSemanticAnimationCompatibilityCategory =
  | "presentation-metadata"
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
  readonly status: KpSemanticAnimationCompatibilityStatus;
  readonly sunsetEvidence: readonly KpCompatibilitySunsetEvidence[];
  readonly requiredClosureEvidence:
    readonly KpCompatibilityClosureEvidenceKind[];
  readonly retirementCondition: string;
}

const equationPresentationDecoder = reference(
  "src/animation/equation-presentation-profile-decoder.ts",
  "decodeKpLegacyEquationPresentationMetadata"
);

export const kpSemanticAnimationCompatibilityLedger = [
  metadata({
    key: "equationMotionPresentationRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationDecoder],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "All accepted equation assets author the typed motion profile."
  }),
  metadata({
    key: "equationNativeHandoffRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationDecoder],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "Native settlement policy is represented in typed equation profiles."
  }),
  metadata({
    key: "equationCancellationPresentationRecipe",
    authors: [],
    consumers: [
      equationPresentationDecoder,
      reference(
        "src/rendering/cancellation-presentation-conformance.ts",
        "equationCancellationPresentationRecipe"
      )
    ],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "Generated and catalog cancellation profiles no longer read metadata."
  }),
  metadata({
    key: "equationZeroWitnessPresentationRecipe",
    authors: [
      reference(
        "src/animation/linear-solve-adapter.ts",
        "equationZeroWitnessPresentationRecipe"
      )
    ],
    consumers: [equationPresentationDecoder],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "Solve-x authors its zero-witness policy through the typed profile."
  }),
  metadata({
    key: "equationSuccessorPresentationRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationDecoder],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "Accepted successor choreography authors typed convergence policy."
  }),
  metadata({
    key: "equationDepthPresentationRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationDecoder],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "Accepted depth policy is promoted without making it semantic truth."
  }),
  metadata({
    key: "equationContinuantPresentationRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationDecoder],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "Continuant transit policy is represented in typed equation profiles."
  }),
  metadata({
    key: "equationBranchPresentationStrategy",
    owner: reference(
        "src/animation/equation-presentation-profile-decoder.ts",
        "equationBranchPresentationStrategy"
    ),
    authors: [],
    consumers: [
      reference(
        "src/animation/equation-presentation-profile-decoder.ts",
        "equationBranchPresentationStrategy"
      )
    ],
    status: "compatibility-only",
    sunsetEvidence: [decoderEvidence()],
    retirementCondition: "Branch scheduling reads a typed equation presentation profile."
  }),
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
  compatibility({
    id: "compatibility.module-scoped-choreography-registries",
    category: "registry",
    owner: reference(
      "src/animation/catalog-packs/algebra.ts",
      "distribution-choreography-register"
    ),
    authors: [
      reference(
        "src/animation/distribution-choreography-register.ts",
        "registerKpDistributionChoreographyRuntime"
      ),
      reference(
        "src/animation/factoring-choreography-register.ts",
        "registerKpFactoringChoreographyRuntime"
      ),
      reference(
        "src/animation/fission-fusion-register.ts",
        "registerKpFissionFusionRuntime"
      )
    ],
    consumers: [
      reference(
        "src/animation/distribution-choreography-runtime.ts",
        "registeredRuntime"
      ),
      reference(
        "src/animation/factoring-choreography-runtime.ts",
        "registeredRuntime"
      ),
      reference(
        "src/animation/fission-fusion-runtime.ts",
        "registeredRuntime"
      )
    ],
    status: "compatibility-only",
    sunsetEvidence: [
      sunsetEvidence(
        "tests/canonical-reverse-choreography.test.ts",
        "registry"
      )
    ],
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: "Capability-pack loading supplies explicit runtime dependencies without import side effects."
  })
] as const satisfies readonly KpSemanticAnimationCompatibilityLedgerEntry[];

export const kpRetiredSemanticAnimationCompatibilityPaths = [
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
  }
] as const;

function equationRecipeAuthors(): KpCompatibilitySourceReference[] {
  return [
    reference(
      "src/animation/linear-solve-adapter.ts",
      "equation"
    )
  ];
}

function metadata(input: {
  readonly key: string;
  readonly owner?: KpCompatibilitySourceReference | undefined;
  readonly authors: readonly KpCompatibilitySourceReference[];
  readonly consumers: readonly KpCompatibilitySourceReference[];
  readonly status: KpSemanticAnimationCompatibilityStatus;
  readonly sunsetEvidence: readonly KpCompatibilitySunsetEvidence[];
  readonly retirementCondition: string;
}): KpSemanticAnimationCompatibilityLedgerEntry {
  return {
    id: `compatibility.metadata.${input.key}`,
    category: "presentation-metadata",
    contractKey: input.key,
    owner: input.owner ?? equationPresentationDecoder,
    authors: input.authors,
    consumers: input.consumers,
    status: input.status,
    sunsetEvidence: input.sunsetEvidence,
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: input.retirementCondition
  };
}

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

function decoderEvidence(): KpCompatibilitySunsetEvidence {
  return sunsetEvidence(
    "tests/equation-presentation-profile-decoder.test.ts",
    "legacy"
  );
}
