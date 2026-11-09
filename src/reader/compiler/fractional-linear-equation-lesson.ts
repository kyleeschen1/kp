import {
  createKpFractionalLinearSelectorAnnotatedLatex
} from "../../rendering/fractional-linear-selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";
import {
  compileKpFractionalLinearEquationLessonModel, type FractionalReadingIdentity
} from "./fractional-linear-equation-lesson-model.ts";
import { serializeKpReaderHydrationManifest } from "./hydration-manifest.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";
import { fractionalPassageOperations } from './fractional-passage-operations.ts';
import { fractionalReadingCommentary } from './fractional-reading-commentary.ts';

export function compileKpFractionalLinearEquationLesson(markdown: string, reading?: FractionalReadingIdentity) {
  const model = compileKpFractionalLinearEquationLessonModel(markdown, reading);
  const notes = fractionalReadingCommentary(model.document, model.animation);
  const prose = compileKpStaticLessonProse(model.document, {
    staticMath: model.staticMath,
    documentTheater: { operations: fractionalPassageOperations(model.hydration.blocks[0]!.checkpoints, model.animation.transformations),
      annotations: new Map(notes.map(stop => [stop.stateId, stop.stateId])) }
  });
  const html = compileKpEquationExemplarPage({
    projection: "document-theater",
    ...(notes.length ? { endpointCommentary: notes } : {}),
    animation: model.animation,
    title: model.document.title,
    description: reading?.description ?? "See a fractional equation solve itself through searchable, reversible steps.",
    documentId: model.document.id,
    documentVersion: model.document.version,
    lessonVariant: "fractional-linear",
    palette: "nocturne",
    modeLink: {
      href: "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpCheckpoint=beat.cancel&kpProgress=667",
      label: "Try the simpler equation"
    },
    tocHtml: prose.tocHtml,
    articleHtml: prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(model.hydration),
    equationPresentation: requireEquationPresentation(model.hydration.blocks[0]),
    annotateState: (state) =>
      createKpFractionalLinearSelectorAnnotatedLatex(state)?.annotated
  });

  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.solve-x.fractional-linear",
    version: model.document.version,
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
