import {
  createExponentRadicalRewriteAnimationAsset
} from "../../../animation/exponent-radical-adapter.ts";
import {
  bindKpExponentRadicalStructuralAnchors
} from "../../../rendering/exponent-radical-selector-annotated-latex.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const radicalSuccessionDescriptor = {
  id: "radical-succession",
  createAnimation: () => createExponentRadicalRewriteAnimationAsset(),
  canonicalTransitionSelection: "all",
  bindStructuralAnchors: bindKpExponentRadicalStructuralAnchors,
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;
