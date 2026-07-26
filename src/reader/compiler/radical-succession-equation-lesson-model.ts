import {
  createExponentRadicalRewriteAnimationAsset
} from "../../animation/exponent-radical-adapter.ts";
import {
  compileKpEquationExemplarLessonModel
} from "./equation-exemplar-lesson-model.ts";

export function compileKpRadicalSuccessionEquationLessonModel(
  markdown: string
) {
  return compileKpEquationExemplarLessonModel({
    animation: createExponentRadicalRewriteAnimationAsset(),
    sourceId: "content/lessons/radical-succession.md",
    documentId: "lesson.exponents.radical-succession",
    version: "1",
    title: "From a half power to a square root",
    language: "en",
    markdown,
    diagnosticLabel: "radical-succession"
  });
}
