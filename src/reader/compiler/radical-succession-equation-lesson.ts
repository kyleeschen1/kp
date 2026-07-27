import {
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../../rendering/exponent-radical-selector-annotated-latex.ts";
import {
  compileKpCanonicalEquationLessonPromotion
} from "./canonical-equation-lesson-promotion-kit.ts";
import {
  compileKpRadicalSuccessionEquationLessonModel
} from "./radical-succession-equation-lesson-model.ts";

export function compileKpRadicalSuccessionEquationLesson(markdown: string) {
  const model = compileKpRadicalSuccessionEquationLessonModel(markdown);
  return compileKpCanonicalEquationLessonPromotion({
    model,
    compiledLessonId: "compiled.lesson.exponents.radical-succession",
    description:
      "Follow a rational exponent into its equivalent square-root notation.",
    lessonVariant: "radical-succession",
    modeLink: {
      href: "/reader/numerator-split-merge/",
      label: "Try a fraction split"
    },
    annotateState: (state) =>
      createKpExponentRadicalSelectorAnnotatedLatex({
        objectId: state.id,
        selectors: state.selectors
      })
  });
}
