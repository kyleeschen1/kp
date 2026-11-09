import {
  createFractionalLinearEquationAnimationAsset
} from "../../animation/fractional-linear-equation-adapter.ts";
import { compileKpEquationExemplarLessonModel } from "./equation-exemplar-lesson-model.ts";

export interface FractionalReadingIdentity {
  readonly sourceId: string;
  readonly version: string;
  readonly title: string;
  readonly description?: string;
}

export function compileKpFractionalLinearEquationLessonModel(markdown: string, reading?: FractionalReadingIdentity) {
  return compileKpEquationExemplarLessonModel({
    animation: createFractionalLinearEquationAnimationAsset(),
    sourceId: reading?.sourceId ?? "content/lessons/solve-fractional-linear.md",
    documentId: "lesson.solve-x.fractional-linear",
    version: reading?.version ?? "1",
    title: reading?.title ?? "Solve x/2 + 3 = 7",
    language: "en",
    markdown,
    diagnosticLabel: "fractional"
  });
}
