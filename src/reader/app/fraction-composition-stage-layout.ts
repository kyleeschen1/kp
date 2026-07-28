import {
  createKpFractionCompositionAnnotatedEndpoints
} from "../../rendering/fraction-composition-selector-annotated-latex.ts";
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

export function applyKpFractionCompositionPhaseStageLayout(input: {
  readonly phaseIntent: KpEquationStagePhaseIntent;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly measurementRoot: HTMLElement;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
}): KpAppliedEquationStageLayout<KpCorridorCertifiedEquationStageLayout> {
  return applyKpSemanticEnvelopeEquationStageLayout({
    ...input,
    endpoints: createKpFractionCompositionAnnotatedEndpoints().map(
      ({ stateId, groupEnvelopes }) => ({
        objectId: stateId,
        groupEnvelopes
      })
    ),
    envelopeDataKey: "kpEquationStageEnvelopeId",
    memberDataKey: "kpEquationStageMemberId",
    envelopeObservation: "member-paint-union",
    diagnosticLabel: "Fraction composition"
  });
}
