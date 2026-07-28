import {
  createKpFractionCompositionEndpointSpecs
} from "../semantic/fraction-composition-endpoint-spec.ts";
import {
  type KpStructuredEquationAnnotatedEndpoint
} from "./structured-equation-selector-annotated-latex.ts";
import {
  createKpSelectorAnnotatedLatex
} from "./selector-annotated-latex.ts";

export function createKpFractionCompositionAnnotatedEndpoints():
readonly KpStructuredEquationAnnotatedEndpoint[] {
  return Object.freeze(createKpFractionCompositionEndpointSpecs().map((spec) => {
    const annotated = createKpSelectorAnnotatedLatex({
      id: `fraction-composition.${spec.stateId}`,
      expectedSelectorIds: spec.selectorIds,
      segments: spec.segments
    });
    return Object.freeze({
      stateId: spec.stateId,
      label: spec.label,
      annotated: Object.freeze({
        ...annotated,
        annotations: Object.freeze(
          annotated.annotations.map((entry) => Object.freeze(entry))
        )
      }),
      groupEnvelopes: spec.groupEnvelopes,
      structuralAnchors: spec.structuralAnchors
    });
  }));
}

export function createKpFractionCompositionSelectorAnnotatedLatex(
  stateId: string
) {
  return createKpFractionCompositionAnnotatedEndpoints()
    .find((endpoint) => endpoint.stateId === stateId)
    ?.annotated;
}
