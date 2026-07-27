import {
  createKpFoldableDistributionSelectorAnnotatedLatex
} from "../../rendering/foldable-distribution-selector-annotated-latex.ts";
import {
  compileKpCanonicalEquationLessonPromotion
} from "./canonical-equation-lesson-promotion-kit.ts";
import {
  compileKpFoldableDistributionLessonModel
} from "./foldable-distribution-lesson-model.ts";

export function compileKpFoldableDistributionEquationLesson(
  markdown: string
) {
  const model = compileKpFoldableDistributionLessonModel(markdown);
  return compileKpCanonicalEquationLessonPromotion({
    model,
    compiledLessonId: "compiled.lesson.algebra.foldable-distribution",
    description:
      "Distribute two grouped products, evaluate them, gather like terms, and collect the result.",
    lessonVariant: "foldable-distribution",
    readerControls: "foldable-distribution-v1",
    modeLink: {
      href: "/canonical-animation-review.html",
      label: "Browse the animation library"
    },
    annotateState: (state) =>
      createKpFoldableDistributionSelectorAnnotatedLatex(state.id)
  });
}
