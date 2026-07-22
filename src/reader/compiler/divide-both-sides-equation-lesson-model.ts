import { createDivideBothSidesEquationAnimationAsset } from "../../animation/divide-both-sides-equation-adapter.ts";
import { compileKpEquationExemplarLessonModel } from "./equation-exemplar-lesson-model.ts";

export function compileKpDivideBothSidesEquationLessonModel(markdown: string) {
  return compileKpEquationExemplarLessonModel({
    animation: createDivideBothSidesEquationAnimationAsset(),
    sourceId: "content/lessons/divide-both-sides.md",
    documentId: "lesson.solve-x.divide-both-sides",
    version: "1",
    title: "Solve 3x = 12",
    language: "en",
    markdown,
    diagnosticLabel: "divide-both-sides"
  });
}
