import { createKpNumeratorSplitMergeSelectorAnnotatedLatex } from "../../rendering/numerator-split-merge-selector-annotated-latex.ts";
import {
  compileKpCanonicalEquationLessonPromotion
} from "./canonical-equation-lesson-promotion-kit.ts";
import { compileKpNumeratorSplitMergeEquationLessonModel } from "./numerator-split-merge-equation-lesson-model.ts";

export function compileKpNumeratorSplitMergeEquationLesson(markdown: string) {
  const model = compileKpNumeratorSplitMergeEquationLessonModel(markdown);
  return compileKpCanonicalEquationLessonPromotion({
    model,
    compiledLessonId: "compiled.lesson.fractions.numerator-split-merge",
    description:
      "See one fraction split across a numerator sum, then merge back " +
      "through the exact inverse motion.",
    lessonVariant: "numerator-split-merge",
    modeLink: {
      href: "/reader/divide-both-sides/",
      label: "Try dividing both sides"
    },
    annotateState: (state) =>
      createKpNumeratorSplitMergeSelectorAnnotatedLatex(state)?.annotated
  });
}
