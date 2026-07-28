import {
  createKpFractionCompositionSelectorAnnotatedLatex
} from "../../rendering/fraction-composition-selector-annotated-latex.ts";
import {
  compileKpCanonicalEquationLessonPromotion
} from "./canonical-equation-lesson-promotion-kit.ts";
import {
  compileKpFractionCompositionLessonModel
} from "./fraction-composition-lesson-model.ts";

export function compileKpFractionCompositionEquationLesson(markdown: string) {
  const model = compileKpFractionCompositionLessonModel(markdown);
  return compileKpCanonicalEquationLessonPromotion({
    model,
    compiledLessonId: "compiled.lesson.algebra.fraction-composition",
    description:
      "Distribute two thirds across a sum, evaluate the constants, and isolate x through exact balanced operations.",
    lessonVariant: "fraction-composition",
    modeLink: {
      href: "/canonical-animation-review.html",
      label: "Browse the animation library"
    },
    annotateState: (state) =>
      createKpFractionCompositionSelectorAnnotatedLatex(state.id)
  });
}
