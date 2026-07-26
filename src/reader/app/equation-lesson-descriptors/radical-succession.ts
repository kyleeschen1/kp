import {
  createExponentRadicalRewriteAnimationAsset
} from "../../../animation/exponent-radical-adapter.ts";
import {
  bindKpExponentRadicalStructuralAnchors
} from "../../../rendering/exponent-radical-selector-annotated-latex.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

/**
 * Kept out of the product registry until the exclusive-ownership slice. The
 * descriptor can still prove policy and adapter compatibility beforehand.
 */
export const radicalSuccessionDescriptor = {
  id: "radical-succession",
  createAnimation: () => createExponentRadicalRewriteAnimationAsset(),
  canonicalTransitionSelection: "all",
  bindStructuralAnchors: bindKpExponentRadicalStructuralAnchors,
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;
