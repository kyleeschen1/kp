import { createKpEquationSeriesLogarithmBaseSemanticSource,
  KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID, KP_LOGARITHM_BASE_AUTHORING_PACK_PIN
} from "../../src/authoring/equation-series-logarithm-base-authoring.ts";
import { kpCanonicalLogarithmChangeOfBase as transformation } from "../../src/semantic/logarithm-change-of-base.ts";

/** Trusted test source stays separate from the editable request; an author
 * cannot obtain proof by supplying matching IDs or endpoint strings alone. */
export function createRoundTripLogRequest() {
  const source = createKpEquationSeriesLogarithmBaseSemanticSource({
    sourceId: "source.round-trip.log-base", revisionId: "revision.round-trip.log-base.v1",
    adjacencyId: "adjacency.round-trip.log-base", transformation
  });
  return { source, value: {
    schemaVersion: "kp.equation-transform-series-request.v1",
    kind: "equation-transform-series-request", id: "series.round-trip.log-base",
    states: [
      { id: transformation.source.stateId, latex: "\\log_2(7)" },
      { id: transformation.target.stateId, latex: "\\frac{\\ln(7)}{\\ln(2)}" }
    ],
    adjacencies: [{ id: "adjacency.round-trip.log-base",
      fromStateId: transformation.source.stateId, toStateId: transformation.target.stateId,
      intent: { mode: "explicit", operationId: KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID,
        semanticArguments: {
          schemaVersion: "kp.equation-series.logarithm-base-intent.v1",
          sourcePin: { sourceId: source.sourceId, revisionId: source.revisionId },
          operationPin: KP_LOGARITHM_BASE_AUTHORING_PACK_PIN,
          semanticBindings: { sourceBaseSemanticId: transformation.source.base.semanticId,
            sourceArgumentSemanticId: transformation.source.argument.semanticId,
            targetLogarithmFunction: "natural-logarithm" },
          domainEvidenceIds: transformation.domainEvidence,
          correspondenceIds: transformation.correspondence.map(({ id }) => id)
        }
      }
    }]
  } };
}
