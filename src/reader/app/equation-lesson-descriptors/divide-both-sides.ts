import {
  createDivideBothSidesEquationAnimationAsset
} from "../../../animation/divide-both-sides-equation-adapter.ts";
import {
  bindKpDivideBothSidesStructuralAnchors
} from "../../../rendering/divide-both-sides-selector-annotated-latex.ts";
import {
  divideBothSidesEquationAssetIds
} from "../../../semantic/divide-both-sides-equation-asset.ts";
import type {
  KpReaderEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const divideBothSidesDescriptor = {
  id: "divide-both-sides",
  createAnimation: () => createDivideBothSidesEquationAnimationAsset(),
  canonicalTransitionSelection: [
    divideBothSidesEquationAssetIds.cancelCoefficient
  ],
  bindStructuralAnchors: bindKpDivideBothSidesStructuralAnchors,
  compactTranscriptAvailable: false
} satisfies KpReaderEquationLessonDescriptor;
