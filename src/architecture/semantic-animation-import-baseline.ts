export type KpSemanticAnimationRenderingImportClassification =
  "compatibility-boundary";

export type KpSemanticAnimationRenderingImportOwner =
  | "semantic"
  | "animation"
  | "domain-ir"
  | "presentation";

export type KpSemanticAnimationRenderingImportRetirementSlice = "s13";

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
export const kpSemanticAnimationRenderingImportBaseline:
  readonly KpSemanticAnimationRenderingImportException[] = [];
