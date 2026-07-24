export type KpSemanticAnimationRenderingImportClassification =
  | "domain-ir-location-debt"
  | "semantic-compiler-location-debt"
  | "motif-contract-location-debt"
  | "neutral-utility-location-debt"
  | "choreography-location-debt"
  | "compatibility-boundary";

export type KpSemanticAnimationRenderingImportOwner =
  | "semantic"
  | "animation"
  | "domain-ir"
  | "presentation";

export type KpSemanticAnimationRenderingImportRetirementSlice =
  | "s09"
  | "s10"
  | "s11"
  | "s12"
  | "s13";

export interface KpSemanticAnimationRenderingImportException {
  readonly sourcePath: `src/${"semantic" | "animation"}/${string}.ts`;
  readonly modulePath:
    `${"../rendering/" | "../../rendering/"}${string}.ts`;
  readonly classification: KpSemanticAnimationRenderingImportClassification;
  readonly intendedOwner: KpSemanticAnimationRenderingImportOwner;
  readonly retirementSlice: KpSemanticAnimationRenderingImportRetirementSlice;
  readonly rationale: string;
}

// Every entry is temporary and exact. This inventory prevents dependency
// inversion from hiding behind a wildcard while ownership moves in slices 9–13.
export const kpSemanticAnimationRenderingImportBaseline = [
  exception({
    sourcePath: "src/semantic/semantic-scene-protocol.ts",
    modulePath: "../rendering/equation-transition-ir.ts",
    classification: "domain-ir-location-debt",
    intendedOwner: "domain-ir",
    retirementSlice: "s09",
    rationale: "Semantic scene projection consumes neutral equation transition state."
  }),
  exception({
    sourcePath: "src/animation/choreography-compiler.ts",
    modulePath: "../rendering/equation-transition-ir.ts",
    classification: "domain-ir-location-debt",
    intendedOwner: "domain-ir",
    retirementSlice: "s09",
    rationale: "Choreography output names the neutral equation transition IR."
  }),
  exception({
    sourcePath: "src/animation/llm-animation-draft-compiler.ts",
    modulePath: "../rendering/equation-transition-ir.ts",
    classification: "domain-ir-location-debt",
    intendedOwner: "domain-ir",
    retirementSlice: "s09",
    rationale: "Generated drafts emit neutral equation transition IR values."
  }),
  exception({
    sourcePath: "src/animation/generated-substitution-fixture.ts",
    modulePath: "../rendering/equation-transition-ir.ts",
    classification: "domain-ir-location-debt",
    intendedOwner: "domain-ir",
    retirementSlice: "s09",
    rationale: "The substitution fixture constructs a neutral equation transition."
  }),
  exception({
    sourcePath: "src/animation/choreography-compiler.ts",
    modulePath: "../rendering/semantic-equation-transition-compiler.ts",
    classification: "semantic-compiler-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s10",
    rationale: "The choreography compiler invokes semantic compilation before rendering."
  }),
  exception({
    sourcePath: "src/animation/llm-animation-draft-compiler.ts",
    modulePath: "../rendering/semantic-equation-transition-compiler.ts",
    classification: "semantic-compiler-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s10",
    rationale: "Draft validation invokes semantic compilation before promotion."
  }),
  exception({
    sourcePath: "src/animation/semantic-motion-library-promotion.ts",
    modulePath: "../rendering/semantic-equation-transition-compiler.ts",
    classification: "semantic-compiler-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s10",
    rationale: "Promotion audits compile semantics independently of a renderer."
  }),
  exception({
    sourcePath: "src/animation/calculus-rule-promotion.ts",
    modulePath: "../rendering/semantic-equation-transition-compiler.ts",
    classification: "semantic-compiler-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s10",
    rationale: "Calculus promotion audits compile semantics independently of a renderer."
  }),
  exception({
    sourcePath: "src/animation/animation-design-diagnostics.ts",
    modulePath: "../rendering/equation-visual-motif-defaults.ts",
    classification: "motif-contract-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s11",
    rationale: "Design diagnostics consume reusable motif policy."
  }),
  exception({
    sourcePath: "src/animation/animation-design-diagnostics.ts",
    modulePath: "../rendering/visual-motif.ts",
    classification: "motif-contract-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s11",
    rationale: "Motif kinds describe choreography intent rather than renderer state."
  }),
  exception({
    sourcePath: "src/animation/llm-semantic-motion-operation-authoring.ts",
    modulePath: "../rendering/equation-visual-motif-defaults.ts",
    classification: "motif-contract-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s11",
    rationale: "Generated operation authoring consumes reusable motif policy."
  }),
  exception({
    sourcePath: "src/animation/llm-semantic-motion-operation-authoring.ts",
    modulePath: "../rendering/visual-motif.ts",
    classification: "motif-contract-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s11",
    rationale: "Generated operation contracts name semantic motif kinds and phases."
  }),
  exception({
    sourcePath: "src/animation/semantic-motion-library-promotion.ts",
    modulePath: "../rendering/visual-motif.ts",
    classification: "motif-contract-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s11",
    rationale: "Promotion requirements name semantic motif kinds."
  }),
  exception({
    sourcePath: "src/animation/substitution-choreography.ts",
    modulePath: "../rendering/executable-motif-grammar.ts",
    classification: "motif-contract-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s11",
    rationale: "Substitution choreography composes executable semantic motifs."
  }),
  exception({
    sourcePath: "src/animation/visual-motif.ts",
    modulePath: "../rendering/visual-motif-composition.ts",
    classification: "motif-contract-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s11",
    rationale: "Animation assets compose motif timelines before renderer adaptation."
  }),
  exception({
    sourcePath: "src/animation/tween.ts",
    modulePath: "../rendering/graph-svg.ts",
    classification: "neutral-utility-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s12",
    rationale: "Saddle morph sampling is numeric animation logic, not SVG state."
  }),
  exception({
    sourcePath: "src/animation/radical-morph-profile.ts",
    modulePath: "../rendering/equation-motion-plan.ts",
    classification: "neutral-utility-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s12",
    rationale: "Easing names are neutral motion vocabulary."
  }),
  exception({
    sourcePath: "src/animation/radical-native-settlement.ts",
    modulePath: "../rendering/equation-motion-plan.ts",
    classification: "neutral-utility-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s12",
    rationale: "Settlement sampling consumes neutral easing vocabulary."
  }),
  exception({
    sourcePath: "src/animation/dot-product-traversal-choreography.ts",
    modulePath: "../rendering/equation-dot-product-traversal.ts",
    classification: "choreography-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s12",
    rationale: "Dot-product traversal plans and samples are choreography-domain logic."
  }),
  exception({
    sourcePath: "src/animation/linear-rearrangement-choreography.ts",
    modulePath: "../rendering/equation-linear-rearrangement.ts",
    classification: "choreography-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s12",
    rationale: "Linear rearrangement kinds classify choreography before rendering."
  }),
  exception({
    sourcePath: "src/animation/matrix-vector-composition-choreography.ts",
    modulePath: "../rendering/equation-matrix-vector-composition.ts",
    classification: "choreography-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s12",
    rationale: "Matrix-vector progression and plans are choreography-domain logic."
  }),
  exception({
    sourcePath: "src/animation/matrix-matrix-composition-choreography.ts",
    modulePath: "../rendering/equation-matrix-matrix-composition.ts",
    classification: "choreography-location-debt",
    intendedOwner: "animation",
    retirementSlice: "s12",
    rationale: "Matrix-matrix progression and plans are choreography-domain logic."
  }),
  exception({
    sourcePath: "src/animation/generated-cancellation-presentation-boundary.ts",
    modulePath: "../rendering/cancellation-presentation-capabilities.ts",
    classification: "compatibility-boundary",
    intendedOwner: "presentation",
    retirementSlice: "s13",
    rationale: "Generated cancellation input depends on measured presentation capabilities."
  }),
  exception({
    sourcePath: "src/animation/generated-cancellation-presentation-boundary.ts",
    modulePath: "../rendering/cancellation-presentation-resolver.ts",
    classification: "compatibility-boundary",
    intendedOwner: "presentation",
    retirementSlice: "s13",
    rationale: "Cancellation intent resolution belongs at the typed presentation seam."
  }),
  exception({
    sourcePath: "src/animation/catalog-packs/algebra.ts",
    modulePath: "../../rendering/equation-witnessed-annihilation-register.ts",
    classification: "compatibility-boundary",
    intendedOwner: "animation",
    retirementSlice: "s13",
    rationale:
      "The lazy algebra pack currently bootstraps one concrete renderer registration by side effect."
  }),
  exception({
    sourcePath: "src/animation/flashcard-renderer-sample.ts",
    modulePath: "../rendering/linear-solve-runtime-visual-sample.ts",
    classification: "compatibility-boundary",
    intendedOwner: "animation",
    retirementSlice: "s13",
    rationale: "The flashcard fixture currently reaches through a renderer-owned sample."
  }),
  exception({
    sourcePath: "src/animation/paused-frame-drilldown.ts",
    modulePath: "../rendering/linear-solve-runtime-visual-sample.ts",
    classification: "compatibility-boundary",
    intendedOwner: "animation",
    retirementSlice: "s13",
    rationale: "The paused-frame fixture currently reaches through a renderer-owned sample."
  })
] as const satisfies readonly KpSemanticAnimationRenderingImportException[];

function exception(
  input: KpSemanticAnimationRenderingImportException
): KpSemanticAnimationRenderingImportException {
  return input;
}
