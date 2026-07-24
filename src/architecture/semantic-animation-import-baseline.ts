export type KpSemanticAnimationRenderingImportClassification =
  "compatibility-boundary";

export type KpSemanticAnimationRenderingImportOwner =
  | "semantic"
  | "animation"
  | "domain-ir"
  | "presentation";

export type KpSemanticAnimationRenderingImportRetirementSlice =
  "s13";

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
