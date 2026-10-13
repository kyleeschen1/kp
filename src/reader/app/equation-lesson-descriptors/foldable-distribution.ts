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
import type { KpReaderEquationLessonDescriptor } from "../equation-lesson-descriptor.ts";
import { defaultAffineCollection, readAffineCollectionEnvelope, type AffineCollectionDerivation } from "../../../semantic/affine-collection-source.ts";

export function createFoldableDistributionDescriptor(d: AffineCollectionDerivation = defaultAffineCollection) {
  return defineKpCanonicalEquationLessonDescriptor({
    id: "foldable-distribution",
    bindSource,
    createAnimation: () =>
      createKpFoldableDistributionEquationAnimationAsset(d),
    bindStructuralAnchors: (input: Parameters<typeof bindKpFoldableDistributionSemanticEnvelopes>[0]) => bindKpFoldableDistributionSemanticEnvelopes(input, d),
    stageLayoutCompiler: Object.freeze({
      apply: (input: Parameters<typeof applyKpFoldableDistributionPhaseStageLayout>[0]) => applyKpFoldableDistributionPhaseStageLayout(input, d)
    }),
    readerControls: "foldable-distribution-v1" as const,
    compactTranscriptAvailable: true
  });
}
function bindSource(source: unknown): KpReaderEquationLessonDescriptor {
  return createFoldableDistributionDescriptor(readAffineCollectionEnvelope(source));
}
export const foldableDistributionDescriptor = createFoldableDistributionDescriptor();
