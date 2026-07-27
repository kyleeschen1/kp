import {
  createExponentRadicalRewriteAnimationAsset
} from "../../../animation/exponent-radical-adapter.ts";
import {
  bindKpExponentRadicalStructuralAnchors
} from "../../../rendering/exponent-radical-selector-annotated-latex.ts";
import {
  defineKpCanonicalEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const radicalSuccessionDescriptor =
  defineKpCanonicalEquationLessonDescriptor({
    id: "radical-succession",
    createAnimation: () => createExponentRadicalRewriteAnimationAsset(),
    bindStructuralAnchors: bindKpExponentRadicalStructuralAnchors,
    compactTranscriptAvailable: false
  });
