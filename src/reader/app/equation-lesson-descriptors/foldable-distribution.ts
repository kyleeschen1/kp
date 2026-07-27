import {
  createKpFoldableDistributionEquationAnimationAsset
} from "../../../animation/foldable-distribution-equation-adapter.ts";
import {
  bindKpFoldableDistributionSemanticEnvelopes
} from "../../../rendering/foldable-distribution-semantic-envelopes.ts";
import {
  applyKpFoldableDistributionPhaseStageLayout
} from "../foldable-distribution-stage-layout.ts";
import {
  defineKpCanonicalEquationLessonDescriptor
} from "../equation-lesson-descriptor.ts";

export const foldableDistributionDescriptor =
  defineKpCanonicalEquationLessonDescriptor({
    id: "foldable-distribution",
    createAnimation: () =>
      createKpFoldableDistributionEquationAnimationAsset(),
    bindStructuralAnchors: bindKpFoldableDistributionSemanticEnvelopes,
    stageLayoutCompiler: Object.freeze({
      apply: applyKpFoldableDistributionPhaseStageLayout
    }),
    readerControls: "foldable-distribution-v1" as const,
    compactTranscriptAvailable: true
  });
