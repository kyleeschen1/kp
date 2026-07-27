import {
  createKpFoldableDistributionEquationAnimationAsset
} from "../../../animation/foldable-distribution-equation-adapter.ts";
import {
  bindKpFoldableDistributionSemanticEnvelopes
} from "../../../rendering/foldable-distribution-semantic-envelopes.ts";
import {
  defineKpCanonicalEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const foldableDistributionDescriptor =
  defineKpCanonicalEquationLessonDescriptor({
    id: "foldable-distribution",
    createAnimation: () =>
      createKpFoldableDistributionEquationAnimationAsset(),
    bindStructuralAnchors: bindKpFoldableDistributionSemanticEnvelopes,
    readerControls: "foldable-distribution-v1" as const,
    compactTranscriptAvailable: true
  });
