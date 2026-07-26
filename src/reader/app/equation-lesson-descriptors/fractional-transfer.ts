import {
  createFractionalLinearTransferBalancedAnimationAsset,
  createFractionalLinearTransferFluentAnimationAsset
} from "../../../animation/fractional-linear-transfer-comparison-adapter.ts";
import {
  bindKpFractionalLinearStructuralAnchors
} from "../../../rendering/fractional-linear-selector-annotated-latex.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const fractionalTransferDescriptor = {
  id: "fractional-transfer",
  createAnimation: (profile) => profile.derivation === "certified-transfer-v1"
    ? createFractionalLinearTransferFluentAnimationAsset()
    : createFractionalLinearTransferBalancedAnimationAsset(),
  bindStructuralAnchors: bindKpFractionalLinearStructuralAnchors,
  stageKicker: (profile) => profile.derivation === "certified-transfer-v1"
    ? "Follow the certified shortcut"
    : undefined,
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;
