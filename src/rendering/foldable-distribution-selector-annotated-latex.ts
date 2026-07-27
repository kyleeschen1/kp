import {
  createKpFoldableDistributionEndpointSpecs,
  type KpFoldableDistributionGroupEnvelope
} from "../semantic/foldable-distribution-endpoint-spec.ts";
import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "./selector-annotated-latex.ts";

export type { KpFoldableDistributionGroupEnvelope };

export interface KpFoldableDistributionAnnotatedEndpoint {
  readonly objectId: string;
  readonly label: string;
  readonly annotated: KpSelectorAnnotatedLatex;
  readonly groupEnvelopes: readonly KpFoldableDistributionGroupEnvelope[];
}

export function createKpFoldableDistributionAnnotatedEndpoints():
  readonly KpFoldableDistributionAnnotatedEndpoint[] {
  return Object.freeze(createKpFoldableDistributionEndpointSpecs().map(
    (spec) => {
      const segments: KpSelectorAnnotatedLatexSegment[] = [];
      spec.tokens.forEach(([selectorId, latex], index) => {
        if (index > 0) segments.push({ kind: "latex", latex: " " });
        segments.push({ kind: "selector", selectorId, latex });
      });
      const annotated = createKpSelectorAnnotatedLatex({
        id: `foldable-distribution.${spec.objectId}`,
        expectedSelectorIds: spec.tokens.map(([selectorId]) => selectorId),
        segments
      });
      return Object.freeze({
        objectId: spec.objectId,
        label: spec.label,
        annotated: Object.freeze({
          ...annotated,
          annotations: Object.freeze(
            annotated.annotations.map((annotation) =>
              Object.freeze(annotation)
            )
          )
        }),
        groupEnvelopes: spec.groupEnvelopes
      });
    }
  ));
}

export function createKpFoldableDistributionSelectorAnnotatedLatex(
  objectId: string
): KpSelectorAnnotatedLatex | undefined {
  return createKpFoldableDistributionAnnotatedEndpoints()
    .find((endpoint) => endpoint.objectId === objectId)
    ?.annotated;
}
