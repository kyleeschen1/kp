import { createKpEquationSeriesLogarithmBaseDraft } from "./equation-series-logarithm-base-source.ts";
import { createKpEquationSeriesLogarithmBaseSemanticSource,
  KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID, KP_LOGARITHM_BASE_AUTHORING_PACK_PIN
} from "./equation-series-logarithm-base-authoring.ts";
import { kpCanonicalLogarithmChangeOfBase as transformation } from "../semantic/logarithm-change-of-base.ts";
import { compileKpEquationTransformSeries, type KpEquationTransformSeriesCompilationState } from "./compile-equation-transform-series.ts";
import { validateKpEquationTransformSeriesRequest } from "./equation-transform-series-request.ts";

export function compileKpEquationSeriesLogarithmBaseExample(value: unknown,
  previous?: KpEquationTransformSeriesCompilationState) {
  const validated = validateKpEquationTransformSeriesRequest(value);
  const intent = validated.status === "accepted" ? validated.request.adjacencies[0]?.intent : undefined;
  // Selecting an example is a bounded binding, not permission to substitute a
  // different registered operation whose geometry happens to be renderable.
  const unsupported = validated.status === "accepted" &&
    (validated.request.adjacencies.length !== 1 || intent?.mode !== "explicit" ||
      intent.operationId !== KP_LOGARITHM_BASE_AUTHORING_OPERATION_ID);
  return compileKpEquationTransformSeries({ value, previous,
    governedSources: [createKpEquationSeriesLogarithmBaseExample().source],
    ...(unsupported ? { externalDiagnostics: [{
      code: "equation-series.example.operation", path: "$.adjacencies",
      message: "This example binds one verified logarithm change-of-base adjacency only.",
      repair: "Restore the example operation and source pins, or select a separately governed authoring path."
    }] } : {})
  });
}

/** Bounded trusted source, separate from editable requests; matching text cannot mint proof. */
export function createKpEquationSeriesLogarithmBaseExample() {
  const source = createKpEquationSeriesLogarithmBaseSemanticSource({
    sourceId: "source.round-trip.log-base", revisionId: "revision.round-trip.log-base.v1",
    adjacencyId: "adjacency.round-trip.log-base", transformation
  });
  const draft = createKpEquationSeriesLogarithmBaseDraft();
  return { source, value: { ...draft, adjacencies: draft.adjacencies.map(adjacency => ({
    ...adjacency, intent: { ...adjacency.intent, semanticArguments: {
      schemaVersion: "kp.equation-series.logarithm-base-intent.v1",
      sourcePin: { sourceId: source.sourceId, revisionId: source.revisionId },
      operationPin: KP_LOGARITHM_BASE_AUTHORING_PACK_PIN,
      semanticBindings: { sourceBaseSemanticId: transformation.source.base.semanticId,
        sourceArgumentSemanticId: transformation.source.argument.semanticId,
        targetLogarithmFunction: "natural-logarithm" },
      domainEvidenceIds: transformation.domainEvidence,
      correspondenceIds: transformation.correspondence.map(({ id }) => id)
    } }
  })) } };
}
