import {
  createKpFractionCompositionEquationAnimationAsset
} from "../../../animation/fraction-composition-equation-adapter.ts";
import {
  bindKpFractionCompositionStructuralAnchors
} from "../../../rendering/fraction-composition-selector-annotated-latex.ts";
import {
  defineKpCanonicalEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const fractionCompositionDescriptor =
  defineKpCanonicalEquationLessonDescriptor({
    id: "fraction-composition",
    createAnimation: () =>
      createKpFractionCompositionEquationAnimationAsset(),
    bindStructuralAnchors: bindKpFractionCompositionStructuralAnchors,
    compactTranscriptAvailable: false
  });
