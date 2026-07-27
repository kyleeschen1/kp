import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import type {
  KpSelectorAnnotatedLatex
} from "../../rendering/selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact
} from "../document/public-api.ts";
import {
  compileKpEquationExemplarPage
} from "./equation-exemplar-page.ts";
import type {
  compileKpEquationExemplarLessonModel
} from "./equation-exemplar-lesson-model.ts";
import {
  serializeKpReaderHydrationManifest
} from "./hydration-manifest.ts";

type KpEquationExemplarLessonModel =
  ReturnType<typeof compileKpEquationExemplarLessonModel>;

export interface KpCanonicalEquationLessonPromotionInput {
  readonly model: KpEquationExemplarLessonModel;
  readonly compiledLessonId: string;
  readonly description: string;
  readonly lessonVariant: string;
  readonly readerControls?: "foldable-distribution-v1" | undefined;
  readonly modeLink: {
    readonly href: string;
    readonly label: string;
  };
  readonly annotateState: (
    state: KpSemanticAssetObject
  ) => KpSelectorAnnotatedLatex | undefined;
}

/**
 * Fraction and radical adoption proved this whole assembly seam is invariant.
 * New promotions supply semantic artifacts and annotations, while the kit
 * preserves reader HTML, hydration, and native presentation ownership.
 */
export function compileKpCanonicalEquationLessonPromotion(
  input: KpCanonicalEquationLessonPromotionInput
) {
  const equationPresentation =
    input.model.hydration.blocks[0]?.equationPresentation;
  if (equationPresentation === undefined) {
    throw new Error(
      `${input.lessonVariant} equation presentation capability is missing`
    );
  }
  const html = compileKpEquationExemplarPage({
    animation: input.model.animation,
    title: input.model.document.title,
    description: input.description,
    documentId: input.model.document.id,
    documentVersion: input.model.document.version,
    lessonVariant: input.lessonVariant,
    readerControls: input.readerControls,
    modeLink: input.modeLink,
    tocHtml: input.model.prose.tocHtml,
    articleHtml: input.model.prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(input.model.hydration),
    equationPresentation,
    annotateState: input.annotateState
  });

  return createKpCompiledLessonArtifact({
    id: input.compiledLessonId,
    version: "1",
    document: {
      kind: "lesson-document",
      id: input.model.document.id,
      version: input.model.document.version
    },
    html,
    tocHtml: input.model.prose.tocHtml,
    hydration: input.model.hydration
  });
}
