import {
  createFractionalLinearEquationAnimationAsset
} from "../../../animation/fractional-linear-equation-adapter.ts";
import {
  bindKpFractionalLinearStructuralAnchors
} from "../../../rendering/fractional-linear-selector-annotated-latex.ts";
import {
  fractionalLinearEquationAssetIds
} from "../../../semantic/fractional-linear-equation-asset.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const fractionalLinearDescriptor = {
  id: "fractional-linear",
  createAnimation: () => createFractionalLinearEquationAnimationAsset(),
  canonicalTransitionSelection: [
    fractionalLinearEquationAssetIds.cancelAdditive,
    fractionalLinearEquationAssetIds.cancelDenominator
  ],
  bindStructuralAnchors: bindKpFractionalLinearStructuralAnchors,
  compactTranscriptAvailable: true
} satisfies KpReaderEquationLessonDescriptor;
