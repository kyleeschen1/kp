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

export type KpSemanticAnimationCompatibilityStatusCandidate =
  | "permanent"
  | "compiles-forward"
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

export interface KpSemanticAnimationCompatibilityLedgerEntry {
  readonly id: string;
  readonly category: KpSemanticAnimationCompatibilityCategory;
  readonly contractKey?: string | undefined;
  readonly owner: KpCompatibilitySourceReference;
  readonly authors: readonly KpCompatibilitySourceReference[];
  readonly consumers: readonly KpCompatibilitySourceReference[];
  readonly statusCandidate: KpSemanticAnimationCompatibilityStatusCandidate;
  readonly requiredClosureEvidence:
    readonly KpCompatibilityClosureEvidenceKind[];
  readonly retirementCondition: string;
}

const equationPresentationPolicy = reference(
  "src/rendering/equation-presentation-policy.ts",
  "kpEquationPresentationPolicy"
);

export const kpSemanticAnimationCompatibilityLedger = [
  metadata({
    key: "equationMotionPresentationRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationPolicy],
    statusCandidate: "compiles-forward",
    retirementCondition: "All accepted equation assets author the typed motion profile."
  }),
  metadata({
    key: "equationNativeHandoffRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationPolicy],
    statusCandidate: "compiles-forward",
    retirementCondition: "Native settlement policy is represented in typed equation profiles."
  }),
  metadata({
    key: "equationCancellationPresentationRecipe",
    authors: [],
    consumers: [
      equationPresentationPolicy,
      reference(
        "src/rendering/cancellation-presentation-conformance.ts",
        "equationCancellationPresentationRecipe"
      )
    ],
    statusCandidate: "compatibility-only",
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
    consumers: [equationPresentationPolicy],
    statusCandidate: "compiles-forward",
    retirementCondition: "Solve-x authors its zero-witness policy through the typed profile."
  }),
  metadata({
    key: "equationSuccessorPresentationRecipe",
    authors: equationRecipeAuthors(false),
    consumers: [equationPresentationPolicy],
    statusCandidate: "compiles-forward",
    retirementCondition: "Accepted successor choreography authors typed convergence policy."
  }),
  metadata({
    key: "equationDepthPresentationRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationPolicy],
    statusCandidate: "compiles-forward",
    retirementCondition: "Accepted depth policy is promoted without making it semantic truth."
  }),
  metadata({
    key: "equationContinuantPresentationRecipe",
    authors: equationRecipeAuthors(),
    consumers: [equationPresentationPolicy],
    statusCandidate: "compiles-forward",
    retirementCondition: "Continuant transit policy is represented in typed equation profiles."
  }),
  metadata({
    key: "equationBranchPresentationStrategy",
    owner: reference(
      "src/animation/linear-rearrangement-choreography.ts",
      "equationBranchPresentationStrategy"
    ),
    authors: [
      reference(
        "src/animation/linear-solve-adapter.ts",
        "equationBranchPresentationStrategy"
      )
    ],
    consumers: [
      reference(
        "src/rendering/equation-linear-rearrangement-bindings.ts",
        "equationBranchPresentationStrategy"
      )
    ],
    statusCandidate: "compiles-forward",
    retirementCondition: "Branch scheduling reads a typed equation presentation profile."
  }),
  metadata({
    key: "equationSequenceEnvelopeRecipe",
    owner: reference(
      "src/animation/divide-both-sides-equation-adapter.ts",
      "equationSequenceEnvelopeRecipe"
    ),
    authors: [
      reference(
        "src/animation/numerator-split-merge-equation-adapter.ts",
        "equationSequenceEnvelopeRecipe"
      )
    ],
    consumers: [],
    statusCandidate: "retirement-candidate",
    retirementCondition: "Repository closure still shows no runtime reader at slice 26."
  }),
  metadata({
    key: "equationFractionHierarchyRecipe",
    owner: reference(
      "src/animation/numerator-split-merge-equation-adapter.ts",
      "equationFractionHierarchyRecipe"
    ),
    authors: [],
    consumers: [],
    statusCandidate: "retirement-candidate",
    retirementCondition: "Repository closure still shows no runtime reader at slice 26."
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
    statusCandidate: "compiles-forward",
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
    statusCandidate: "compatibility-only",
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
    statusCandidate: "compiles-forward",
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
    statusCandidate: "retained-fixture",
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
    statusCandidate: "compiles-forward",
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
    statusCandidate: "retained-fixture",
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
    statusCandidate: "compatibility-only",
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
    statusCandidate: "compatibility-only",
    requiredClosureEvidence: ["reference", "replacement", "fixture"],
    retirementCondition: "Capability-pack loading supplies explicit runtime dependencies without import side effects."
  })
] as const satisfies readonly KpSemanticAnimationCompatibilityLedgerEntry[];

function equationRecipeAuthors(
  includeNumeratorSplitMerge = true
): KpCompatibilitySourceReference[] {
  const names = [
    "divide-both-sides-equation-adapter",
    "fractional-linear-equation-adapter",
    "fractional-linear-transfer-comparison-adapter",
    "linear-solve-adapter"
  ];
  if (includeNumeratorSplitMerge) {
    names.push("numerator-split-merge-equation-adapter");
  }
  return names.map((name) =>
    reference(
      `src/animation/${name}.ts`,
      "equation"
    )
  );
}

function metadata(input: {
  readonly key: string;
  readonly owner?: KpCompatibilitySourceReference | undefined;
  readonly authors: readonly KpCompatibilitySourceReference[];
  readonly consumers: readonly KpCompatibilitySourceReference[];
  readonly statusCandidate: KpSemanticAnimationCompatibilityStatusCandidate;
  readonly retirementCondition: string;
}): KpSemanticAnimationCompatibilityLedgerEntry {
  return {
    id: `compatibility.metadata.${input.key}`,
    category: "presentation-metadata",
    contractKey: input.key,
    owner: input.owner ?? equationPresentationPolicy,
    authors: input.authors,
    consumers: input.consumers,
    statusCandidate: input.statusCandidate,
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
