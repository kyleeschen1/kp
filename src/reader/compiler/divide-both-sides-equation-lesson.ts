import { createKpDivideBothSidesSelectorAnnotatedLatex } from "../../rendering/divide-both-sides-selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import { compileKpDivideBothSidesEquationLessonModel } from "./divide-both-sides-equation-lesson-model.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";
import { serializeKpReaderHydrationManifest } from "./hydration-manifest.ts";

export function compileKpDivideBothSidesEquationLesson(markdown: string) {
  const model = compileKpDivideBothSidesEquationLessonModel(markdown);
  const html = compileKpEquationExemplarPage({
    animation: model.animation,
    title: model.document.title,
    description: "See both sides become fractions, cancel a coefficient, and resolve an exact quotient.",
    documentId: model.document.id,
    documentVersion: model.document.version,
    lessonVariant: "divide-both-sides",
    modeLink: {
      href: "/reader/solve-fractional-linear/",
      label: "Try the longer fraction lesson"
    },
    tocHtml: model.prose.tocHtml,
    articleHtml: model.prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: requireEquationPresentation(model.hydration.blocks[0]),
    annotateState: (state) =>
      createKpDivideBothSidesSelectorAnnotatedLatex(state)?.annotated
  });

  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.solve-x.divide-both-sides",
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
    throw new Error("divide-both-sides equation presentation capability is missing");
  }
  return block.equationPresentation;
}
