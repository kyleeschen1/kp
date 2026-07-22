import {
  createFractionalLinearTransferFluentAnimationAsset
} from "../../animation/fractional-linear-transfer-comparison-adapter.ts";
import {
  createKpFractionalLinearSelectorAnnotatedLatex
} from "../../rendering/fractional-linear-selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";
import {
  compileKpFractionalTransferComparisonLessonModel
} from "./fractional-transfer-comparison-lesson-model.ts";
import { serializeKpReaderHydrationManifest } from "./hydration-manifest.ts";

export function compileKpFractionalTransferComparisonLesson(markdown: string) {
  const model = compileKpFractionalTransferComparisonLessonModel(markdown);
  const html = compileKpEquationExemplarPage({
    animation: model.animation,
    presentationAnimations: [createFractionalLinearTransferFluentAnimationAsset()],
    showEquationProfileControl: true,
    title: model.document.title,
    description: "Compare a complete balanced proof with its certified fluent projection.",
    documentId: model.document.id,
    documentVersion: model.document.version,
    lessonVariant: "fractional-transfer",
    modeLink: {
      href: "/reader/divide-both-sides/",
      label: "See division enter explicitly"
    },
    tocHtml: model.prose.tocHtml,
    articleHtml: model.prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: requireEquationPresentation(model.hydration.blocks[0]),
    annotateState: (state) =>
      createKpFractionalLinearSelectorAnnotatedLatex(state)?.annotated
  });

  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.solve-x.fractional-transfer-comparison",
    version: "1",
    document: {
      kind: "lesson-document",
      id: model.document.id,
      version: model.document.version
    },
    html,
    tocHtml: model.prose.tocHtml,
    hydration: model.hydration
  });
}

function requireEquationPresentation(
  block: {
    readonly equationPresentation?: KpReaderEquationPresentationCapability | undefined;
  } | undefined
) {
  if (block?.equationPresentation === undefined) {
    throw new Error("fractional transfer presentation capability is missing");
  }
  return block.equationPresentation;
}
