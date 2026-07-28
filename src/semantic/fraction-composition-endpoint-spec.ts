import {
  createKpLawfulFractionSolveMacro
} from "./fraction-solve-macro.ts";
import {
  createKpStructuredEquationEndpointSpec,
  type KpStructuredEquationEndpointSpec
} from "./structured-equation-endpoint-spec.ts";

export function createKpFractionCompositionEndpointSpecs():
readonly KpStructuredEquationEndpointSpec[] {
  const macro = createKpLawfulFractionSolveMacro();
  const endpoints = macro.states.map(createKpStructuredEquationEndpointSpec);
  if (
    endpoints.length !== macro.verification.stateCount ||
    endpoints.some(
      (endpoint, index) => endpoint.stateId !== macro.verification.stateIds[index]
    )
  ) {
    throw new Error(
      "Fraction composition endpoint compiler must consume the certified state chain exactly."
    );
  }
  return Object.freeze(endpoints);
}
