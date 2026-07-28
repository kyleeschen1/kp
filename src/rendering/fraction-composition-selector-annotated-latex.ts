import {
  createKpFractionCompositionEndpointSpecs
} from "../semantic/fraction-composition-endpoint-spec.ts";
import {
  bindKpStructuredEquationStructuralAnchors,
  type KpStructuredEquationAnnotatedEndpoint
} from "./structured-equation-selector-annotated-latex.ts";
import type {
  KpSemanticAssetObject
} from "../semantic/asset.ts";
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

export function bindKpFractionCompositionStructuralAnchors(input: {
  readonly root: HTMLElement;
  readonly state: KpSemanticAssetObject;
}): void {
  const endpoint = createKpFractionCompositionAnnotatedEndpoints()
    .find(({ stateId }) => stateId === input.state.id);
  if (endpoint === undefined) {
    throw new Error(
      `Fraction composition state ${input.state.id} has no native endpoint.`
    );
  }
  bindKpStructuredEquationStructuralAnchors({
    root: input.root,
    endpoint
  });
}
