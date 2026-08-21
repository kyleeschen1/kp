import {
  isKpVerifiedClosedRootEvaluationExemplar,
  kpClosedRootEvaluationExemplar,
  type KpVerifiedClosedRootEvaluationExemplar
} from "../semantic/closed-root-evaluation-exemplar.ts";
import {
  createKpRootRewriteNativeEndpoint,
  type KpRootRewriteNativeEndpoint
} from "./root-rewrite-native-endpoint.ts";

export interface KpClosedRootEvaluationNativeEndpointSet {
  readonly exemplar: KpVerifiedClosedRootEvaluationExemplar;
  readonly source: KpRootRewriteNativeEndpoint;
  readonly target: KpRootRewriteNativeEndpoint;
}

export function createKpClosedRootEvaluationNativeEndpoints(
  exemplar: KpVerifiedClosedRootEvaluationExemplar
): KpClosedRootEvaluationNativeEndpointSet {
  if (!isKpVerifiedClosedRootEvaluationExemplar(exemplar)) {
    throw new Error("Closed-root endpoints require a verified exemplar.");
  }
  const [source, target] = exemplar.states;
  const endpoints = Object.freeze({
    exemplar,
    source: createKpRootRewriteNativeEndpoint({
      endpoint: "source",
      stateId: source.id,
      accessibleText: source.accessibleText,
      root: {
        kind: "radical",
        occurrence: source.radical,
        role: "radical",
        radicand: {
          kind: "token",
          occurrence: source.radicand,
          role: "radicand",
          latex: "144"
        }
      }
    }),
    target: createKpRootRewriteNativeEndpoint({
      endpoint: "target",
      stateId: target.id,
      accessibleText: target.accessibleText,
      root: {
        kind: "token",
        occurrence: target.value,
        role: "value",
        latex: "12"
      }
    })
  });
  if (endpoints.source.annotated.rawLatex !== source.latex ||
    endpoints.target.annotated.rawLatex !== target.latex) {
    throw new Error(
      "Closed-root Native endpoints diverge from verified semantic states."
    );
  }
  return endpoints;
}

export const kpClosedRootEvaluationNativeEndpoints =
  createKpClosedRootEvaluationNativeEndpoints(
    kpClosedRootEvaluationExemplar
  );
