import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../../../animation/numerator-split-merge-equation-adapter.ts";
import {
  bindKpNumeratorSplitMergeStructuralAnchors
} from "../../../rendering/numerator-split-merge-selector-annotated-latex.ts";
import {
  defineKpCanonicalEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const numeratorSplitMergeDescriptor =
  defineKpCanonicalEquationLessonDescriptor({
    id: "numerator-split-merge",
    createAnimation: () => createNumeratorSplitMergeEquationAnimationAsset(),
    bindStructuralAnchors: bindKpNumeratorSplitMergeStructuralAnchors,
    compactTranscriptAvailable: false
  });
