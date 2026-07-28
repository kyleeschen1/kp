import {
  createKpFractionCompositionEquationAnimationAsset
} from "../../animation/fraction-composition-equation-adapter.ts";
import {
  kpFractionCompositionPreservationManifest as manifest
} from "./fraction-composition-preservation-manifest.ts";
import {
  compileKpEquationExemplarLessonModel
} from "./equation-exemplar-lesson-model.ts";

export function compileKpFractionCompositionLessonModel(markdown: string) {
  return compileKpEquationExemplarLessonModel({
    animation: createKpFractionCompositionEquationAnimationAsset(),
    sourceId: "content/lessons/fraction-composition.md",
    documentId: manifest.document.id,
    version: manifest.document.version,
    title: manifest.document.title,
    language: "en",
    markdown,
    diagnosticLabel: "fraction-composition"
  });
}
