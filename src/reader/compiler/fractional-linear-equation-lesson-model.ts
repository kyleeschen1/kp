import {
  createFractionalLinearEquationAnimationAsset
} from "../../animation/fractional-linear-equation-adapter.ts";
import { compileKpEquationExemplarLessonModel } from "./equation-exemplar-lesson-model.ts";

export function compileKpFractionalLinearEquationLessonModel(markdown: string) {
  return compileKpEquationExemplarLessonModel({
    animation: createFractionalLinearEquationAnimationAsset(),
    sourceId: "content/lessons/solve-fractional-linear.md",
    documentId: "lesson.solve-x.fractional-linear",
    version: "1",
    title: "Solve x/2 + 3 = 7",
    language: "en",
    markdown,
    diagnosticLabel: "fractional"
  });
}
