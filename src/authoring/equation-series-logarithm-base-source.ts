import { kpCanonicalLogarithmChangeOfBase as transformation } from "../semantic/logarithm-change-of-base.ts";

export const KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID = "kp.algebra.change-logarithm-base" as const;
export const KP_LOGARITHM_BASE_AUTHORING_PACK_PIN = Object.freeze({
  packId: "kp.logarithm-change-of-base", version: "1.0.0"
} as const);

/** Editable notation carries no issued source, correspondence or paint authority. */
export function createKpEquationSeriesLogarithmBaseDraft() {
  return {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request", id: "series.round-trip.log-base",
    states: [
      { id: transformation.source.stateId, latex: "\\log_2(7)" },
      { id: transformation.target.stateId, latex: "\\frac{\\ln(7)}{\\ln(2)}" }
    ],
    adjacencies: [{ id: "adjacency.round-trip.log-base",
      fromStateId: transformation.source.stateId, toStateId: transformation.target.stateId,
      intent: { mode: "explicit", operationId: KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
        semanticArguments: {} }
    }]
  };
}
