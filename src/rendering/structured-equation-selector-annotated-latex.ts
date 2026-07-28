import {
  createKpStructuredEquationEndpointSpec,
  type KpStructuredEquationGroupEnvelope,
  type KpStructuredEquationStructuralAnchor
} from "../semantic/structured-equation-endpoint-spec.ts";
import type {
  KpFractionSolveEquationState
} from "../semantic/fraction-solve-macro.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex
} from "./selector-annotated-latex.ts";

export type {
  KpStructuredEquationGroupEnvelope,
  KpStructuredEquationStructuralAnchor
};

export interface KpStructuredEquationAnnotatedEndpoint {
  readonly stateId: string;
  readonly label: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly groupEnvelopes: readonly KpStructuredEquationGroupEnvelope[];
  readonly structuralAnchors: readonly KpStructuredEquationStructuralAnchor[];
}

export function createKpStructuredEquationAnnotatedEndpoint(
  state: KpFractionSolveEquationState
): KpStructuredEquationAnnotatedEndpoint {
  const spec = createKpStructuredEquationEndpointSpec(state);
  const annotated = createKpSelectorAnnotatedLatex({
    id: `fraction-composition.${state.id}`,
    expectedSelectorIds: spec.selectorIds,
    segments: spec.segments
  });
  return Object.freeze({
    stateId: spec.stateId,
    label: spec.label,
    annotated: Object.freeze({
      ...annotated,
      annotations: Object.freeze(annotated.annotations.map((entry) => Object.freeze(entry)))
    }),
    groupEnvelopes: spec.groupEnvelopes,
    structuralAnchors: spec.structuralAnchors
  });
}

export function bindKpStructuredEquationStructuralAnchors(input: {
  readonly root: ParentNode;
  readonly endpoint: KpStructuredEquationAnnotatedEndpoint;
}): void {
  const fractionRules = [
    ...input.root.querySelectorAll<HTMLElement>(".frac-line")
  ];
  if (fractionRules.length !== input.endpoint.structuralAnchors.length) {
    throw new Error(
      `${input.endpoint.stateId} expected ${input.endpoint.structuralAnchors.length} ` +
      `fraction rules, received ${fractionRules.length}.`
    );
  }
  input.endpoint.structuralAnchors.forEach((anchor, index) => {
    const element = fractionRules[index]!;
    element.dataset["kpReaderEquationAnchorId"] = `anchor.${anchor.id}`;
    element.dataset["kpReaderSelectorId"] = anchor.id;
  });
}
