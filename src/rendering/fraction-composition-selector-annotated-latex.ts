import {
  createKpLawfulFractionSolveMacro
} from "../semantic/fraction-solve-macro.ts";
import {
  createKpStructuredEquationAnnotatedEndpoint,
  type KpStructuredEquationAnnotatedEndpoint
} from "./structured-equation-selector-annotated-latex.ts";

export function createKpFractionCompositionAnnotatedEndpoints():
readonly KpStructuredEquationAnnotatedEndpoint[] {
  const macro = createKpLawfulFractionSolveMacro();
  const endpoints = macro.states.map(createKpStructuredEquationAnnotatedEndpoint);
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

export function createKpFractionCompositionSelectorAnnotatedLatex(
  stateId: string
) {
  return createKpFractionCompositionAnnotatedEndpoints()
    .find((endpoint) => endpoint.stateId === stateId)
    ?.annotated;
}
