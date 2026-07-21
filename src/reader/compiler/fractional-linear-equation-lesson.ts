import {
  createKpFractionalLinearSelectorAnnotatedLatex
} from "../../rendering/fractional-linear-selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";
import {
  compileKpFractionalLinearEquationLessonModel
} from "./fractional-linear-equation-lesson-model.ts";
import { serializeKpReaderHydrationManifest } from "./hydration-manifest.ts";

export function compileKpFractionalLinearEquationLesson(markdown: string) {
  const model = compileKpFractionalLinearEquationLessonModel(markdown);
  const html = compileKpEquationExemplarPage({
    animation: model.animation,
    title: model.document.title,
    description: "See a fractional equation solve itself through searchable, reversible steps.",
    documentId: model.document.id,
    documentVersion: model.document.version,
    lessonVariant: "fractional-linear",
    modeLink: {
      href: "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpCheckpoint=beat.cancel&kpProgress=667",
      label: "Try the simpler equation"
    },
    tocHtml: model.prose.tocHtml,
    articleHtml: model.prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: requireEquationPresentation(model.hydration.blocks[0]),
    annotateState: (state) =>
      createKpFractionalLinearSelectorAnnotatedLatex(state)?.annotated
  });

  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.solve-x.fractional-linear",
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
    throw new Error("fractional equation presentation capability is missing");
  }
  return block.equationPresentation;
}
