import { createNumeratorSplitMergeEquationAnimationAsset } from "../../animation/numerator-split-merge-equation-adapter.ts";
import { compileKpEquationExemplarLessonModel } from "./equation-exemplar-lesson-model.ts";

export function compileKpNumeratorSplitMergeEquationLessonModel(markdown: string) {
  return compileKpEquationExemplarLessonModel({
    animation: createNumeratorSplitMergeEquationAnimationAsset(),
    sourceId: "content/lessons/numerator-split-merge.md",
    documentId: "lesson.fractions.numerator-split-merge",
    version: "1",
    title: "Split and merge a fraction",
    language: "en",
    markdown,
    diagnosticLabel: "numerator-split-merge"
  });
}
