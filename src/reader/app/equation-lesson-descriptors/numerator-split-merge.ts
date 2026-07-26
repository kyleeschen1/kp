import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../../../animation/numerator-split-merge-equation-adapter.ts";
import {
  bindKpNumeratorSplitMergeStructuralAnchors
} from "../../../rendering/numerator-split-merge-selector-annotated-latex.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const numeratorSplitMergeDescriptor = {
  id: "numerator-split-merge",
  createAnimation: () => createNumeratorSplitMergeEquationAnimationAsset(),
  bindStructuralAnchors: bindKpNumeratorSplitMergeStructuralAnchors,
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;
