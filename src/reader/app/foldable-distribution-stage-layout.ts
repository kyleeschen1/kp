import {
  createKpFoldableDistributionAnnotatedEndpoints
} from "../../rendering/foldable-distribution-selector-annotated-latex.ts";
import type {
  KpAppliedEquationStageLayout,
  KpEquationStageMeasurementIdentity,
  KpEquationStagePhaseIntent
} from "../runtime/public-api.ts";
import type {
  KpCorridorCertifiedEquationStageLayout
} from "../runtime/public-api.ts";
import {
  applyKpSemanticEnvelopeEquationStageLayout
} from "./semantic-envelope-stage-layout.ts";
import { defaultAffineCollection, type AffineCollectionDerivation } from "../../semantic/affine-collection-source.ts";

export function applyKpFoldableDistributionPhaseStageLayout(input: {
  readonly phaseIntent: KpEquationStagePhaseIntent;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly measurementRoot: HTMLElement;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
}, d: AffineCollectionDerivation = defaultAffineCollection): KpAppliedEquationStageLayout<KpCorridorCertifiedEquationStageLayout> {
  return applyKpSemanticEnvelopeEquationStageLayout({
    ...input,
    endpoints: createKpFoldableDistributionAnnotatedEndpoints(d).map(
      ({ objectId, groupEnvelopes }) => ({ objectId, groupEnvelopes })
    ),
    envelopeDataKey: "kpFoldableEnvelopeId",
    memberDataKey: "kpFoldableLayoutMemberId",
    envelopeObservation: "wrapped",
    diagnosticLabel: "Foldable distribution"
  });
}
