import {
  isKpVerifiedRootExtractionPressureCase,
  kpRootExtractionPressureCorpus,
  type KpVerifiedRootExtractionPressureCase
} from "../semantic/root-extraction-pressure-corpus.ts";
import type { KpRootRewriteOccurrence } from
  "../semantic/root-rewrite-plan.ts";
import {
  createKpRootRewriteNativeEndpoint,
  type KpRootRewriteEndpointExpressionNode,
  type KpRootRewriteNativeEndpoint
} from "./root-rewrite-native-endpoint.ts";

export interface KpRootExtractionPressureNativeEndpointSet {
  readonly exemplar: KpVerifiedRootExtractionPressureCase;
  readonly source: KpRootRewriteNativeEndpoint;
  readonly target: KpRootRewriteNativeEndpoint;
}

export function createKpRootExtractionPressureNativeEndpoints(
  exemplar: KpVerifiedRootExtractionPressureCase
): KpRootExtractionPressureNativeEndpointSet {
  if (!isKpVerifiedRootExtractionPressureCase(exemplar)) {
    throw new Error("Root extraction endpoints require verified pressure data.");
  }
  const [source, target] = exemplar.states;
  const endpoints = Object.freeze({
    exemplar,
    source: createKpRootRewriteNativeEndpoint({
      endpoint: "source",
      stateId: source.id,
      accessibleText: source.accessibleText,
      root: exemplar.operationClass === "mixed-evaluation"
        ? mixedSource(exemplar)
        : partialSource(exemplar)
    }),
    target: createKpRootRewriteNativeEndpoint({
      endpoint: "target",
      stateId: target.id,
      accessibleText: target.accessibleText,
      root: exemplar.operationClass === "mixed-evaluation"
        ? mixedTarget(exemplar)
        : partialTarget(exemplar)
    })
  });
  if (endpoints.source.annotated.rawLatex !== source.latex ||
    endpoints.target.annotated.rawLatex !== target.latex) {
    throw new Error("Root extraction endpoints diverge from semantic states.");
  }
  return endpoints;
}

export const kpRootExtractionPressureNativeEndpointCorpus = Object.freeze(
  kpRootExtractionPressureCorpus.map(
    createKpRootExtractionPressureNativeEndpoints
  )
);

function mixedSource(
  exemplar: KpVerifiedRootExtractionPressureCase
): KpRootRewriteEndpointExpressionNode {
  const source = exemplar.states[0].occurrences;
  return radical(source["radical"]!, sequence(source["radicand"]!, [
    token(source["coefficient"]!, "coefficient", "4"),
    power(source["power"]!, source["carrier"]!, source["exponent"]!)
  ]));
}

function mixedTarget(
  exemplar: KpVerifiedRootExtractionPressureCase
): KpRootRewriteEndpointExpressionNode {
  const target = exemplar.states[1].occurrences;
  return sequence(target["expression"]!, [
    token(target["coefficient"]!, "coefficient", "2"),
    absoluteValue(target["absoluteValue"]!, target["carrier"]!)
  ]);
}

function partialSource(
  exemplar: KpVerifiedRootExtractionPressureCase
): KpRootRewriteEndpointExpressionNode {
  const source = exemplar.states[0].occurrences;
  return radical(source["radical"]!, sequence(source["radicand"]!, [
    power(source["power"]!, source["carrier"]!, source["exponent"]!),
    token(source["residual"]!, "residual", "y")
  ]));
}

function partialTarget(
  exemplar: KpVerifiedRootExtractionPressureCase
): KpRootRewriteEndpointExpressionNode {
  const target = exemplar.states[1].occurrences;
  return sequence(target["expression"]!, [
    absoluteValue(target["absoluteValue"]!, target["carrier"]!),
    radical(target["radical"]!,
      token(target["residual"]!, "residual", "y"))
  ]);
}

function power(
  occurrence: KpRootRewriteOccurrence,
  carrier: KpRootRewriteOccurrence,
  exponent: KpRootRewriteOccurrence
): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "power",
    occurrence,
    role: "radicand",
    base: token(carrier, "carrier", "x"),
    exponent: token(exponent, "exponent", "2")
  };
}

function radical(
  occurrence: KpRootRewriteOccurrence,
  radicand: KpRootRewriteEndpointExpressionNode
): KpRootRewriteEndpointExpressionNode {
  return { kind: "radical", occurrence, role: "radical", radicand };
}

function absoluteValue(
  occurrence: KpRootRewriteOccurrence,
  carrier: KpRootRewriteOccurrence
): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "absolute-value",
    occurrence,
    role: "enclosure",
    body: token(carrier, "carrier", "x")
  };
}

function sequence(
  occurrence: KpRootRewriteOccurrence,
  children: readonly KpRootRewriteEndpointExpressionNode[]
): KpRootRewriteEndpointExpressionNode {
  return { kind: "sequence", occurrence, role: "expression", children };
}

function token(
  occurrence: KpRootRewriteOccurrence,
  role: "carrier" | "exponent" | "coefficient" | "residual",
  latex: string
): KpRootRewriteEndpointExpressionNode {
  return { kind: "token", occurrence, role, latex };
}
