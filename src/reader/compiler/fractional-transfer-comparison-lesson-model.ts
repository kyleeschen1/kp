import {
  createFractionalLinearTransferBalancedAnimationAsset
} from "../../animation/fractional-linear-transfer-comparison-adapter.ts";
import { compileKpEquationExemplarLessonModel } from "./equation-exemplar-lesson-model.ts";

export function compileKpFractionalTransferComparisonLessonModel(markdown: string) {
  return compileKpEquationExemplarLessonModel({
    animation: createFractionalLinearTransferBalancedAnimationAsset(),
    sourceId: "content/lessons/fractional-transfer-comparison.md",
    documentId: "lesson.solve-x.fractional-transfer-comparison",
    version: "1",
    title: "From x/2 = 4 to x = 8",
    language: "en",
    markdown,
    diagnosticLabel: "fractional transfer comparison"
  });
}
