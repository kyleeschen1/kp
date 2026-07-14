import type { KpAssetBundle } from "./asset.ts";
import type { KpSemanticDiagramSequence } from "./asset-diagram.ts";
import type { KpTransformationDrillDownHook } from "./asset-decomposition.ts";
import type { KpFlashcardSpec } from "./asset-flashcard.ts";
import type { KpSemanticTransformation } from "./asset-transformation.ts";
import type { AlgebraTraceFixture } from "./algebra-trace-port-fixture.ts";

export interface GeneratedProblemAnimationFixture {
  readonly id: string;
  readonly familyId: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly diagram: KpSemanticDiagramSequence;
  readonly trace: AlgebraTraceFixture;
  readonly drillDownHooks: readonly KpTransformationDrillDownHook[];
  readonly flashcards: readonly KpFlashcardSpec[];
}
