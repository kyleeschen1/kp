import { createKpNumeratorSplitMergeSelectorAnnotatedLatex } from "../../rendering/numerator-split-merge-selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";
import { serializeKpReaderHydrationManifest } from "./hydration-manifest.ts";
import { compileKpNumeratorSplitMergeEquationLessonModel } from "./numerator-split-merge-equation-lesson-model.ts";

export function compileKpNumeratorSplitMergeEquationLesson(markdown: string) {
  const model = compileKpNumeratorSplitMergeEquationLessonModel(markdown);
  const html = compileKpEquationExemplarPage({
    animation: model.animation,
    title: model.document.title,
    description: "See one fraction split across a numerator sum, then merge back through the exact inverse motion.",
    documentId: model.document.id,
    documentVersion: model.document.version,
    lessonVariant: "numerator-split-merge",
    modeLink: {
      href: "/reader/divide-both-sides/",
      label: "Try dividing both sides"
    },
    tocHtml: model.prose.tocHtml,
    articleHtml: model.prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: requireEquationPresentation(model.hydration.blocks[0]),
    annotateState: (state) =>
      createKpNumeratorSplitMergeSelectorAnnotatedLatex(state)?.annotated
  });

  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.fractions.numerator-split-merge",
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
    throw new Error("numerator-split-merge equation presentation capability is missing");
  }
  return block.equationPresentation;
}
