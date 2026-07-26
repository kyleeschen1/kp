import {
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../../rendering/exponent-radical-selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";
import { serializeKpReaderHydrationManifest } from "./hydration-manifest.ts";
import {
  compileKpRadicalSuccessionEquationLessonModel
} from "./radical-succession-equation-lesson-model.ts";

export function compileKpRadicalSuccessionEquationLesson(markdown: string) {
  const model = compileKpRadicalSuccessionEquationLessonModel(markdown);
  const html = compileKpEquationExemplarPage({
    animation: model.animation,
    title: model.document.title,
    description:
      "Follow a rational exponent into its equivalent square-root notation.",
    documentId: model.document.id,
    documentVersion: model.document.version,
    lessonVariant: "radical-succession",
    modeLink: {
      href: "/reader/numerator-split-merge/",
      label: "Try a fraction split"
    },
    tocHtml: model.prose.tocHtml,
    articleHtml: model.prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: requireEquationPresentation(model.hydration.blocks[0]),
    annotateState: (state) =>
      createKpExponentRadicalSelectorAnnotatedLatex({
        objectId: state.id,
        selectors: state.selectors
      })
  });

  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.exponents.radical-succession",
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
    readonly equationPresentation?:
      KpReaderEquationPresentationCapability | undefined;
  } | undefined
) {
  if (block?.equationPresentation === undefined) {
    throw new Error(
      "radical-succession equation presentation capability is missing"
    );
  }
  return block.equationPresentation;
}
