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
import { projectEquationCheckpointProgress } from '../equation-checkpoint-progress.ts';

export const fractionalLinearDescriptor = {
  id: "fractional-linear",
  focusPaint: 'native-color',
  createAnimation: () => createFractionalLinearEquationAnimationAsset(),
  projectAnimationProgress: (progress: number) => projectEquationCheckpointProgress(progress, 6),
  canonicalTransitionSelection: [
    fractionalLinearEquationAssetIds.cancelAdditive,
    // Execute the registered evaluation plan instead of the legacy fading
    // sampler. Both arithmetic steps share the standard evaluation authority.
    fractionalLinearEquationAssetIds.simplifyDifference,
    fractionalLinearEquationAssetIds.cancelDenominator,
    fractionalLinearEquationAssetIds.simplifyProduct
  ],
  bindStructuralAnchors: bindKpFractionalLinearStructuralAnchors,
  compactTranscriptAvailable: true
} satisfies KpReaderEquationLessonDescriptor;
