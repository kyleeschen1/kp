import {
  isKpVerifiedRationalExponentCompositionExemplar,
  kpRationalExponentCompositionExemplar,
  type KpVerifiedRationalExponentCompositionExemplar
} from "../semantic/rational-exponent-composition-exemplar.ts";
import type { KpRootRewriteOccurrence } from
  "../semantic/root-rewrite-plan.ts";
import {
  createKpRootRewriteNativeEndpoint,
  type KpRootRewriteNativeEndpoint
} from "./root-rewrite-native-endpoint.ts";

export interface KpRationalExponentCompositionNativeEndpointSet {
  readonly exemplar: KpVerifiedRationalExponentCompositionExemplar;
  readonly source: KpRootRewriteNativeEndpoint;
  readonly target: KpRootRewriteNativeEndpoint;
}

export function createKpRationalExponentCompositionNativeEndpoints(
  exemplar: KpVerifiedRationalExponentCompositionExemplar
): KpRationalExponentCompositionNativeEndpointSet {
  if (!isKpVerifiedRationalExponentCompositionExemplar(exemplar)) {
    throw new Error("Rational-exponent endpoints require verified authority.");
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
        index: token(source.rootIndex, "root-index", "3"),
        radicand: {
          kind: "power",
          occurrence: source.power,
          role: "radicand",
          base: token(source.carrier, "carrier", "x"),
          exponent: token(source.exponent, "exponent", "2")
        }
      }
    }),
    target: createKpRootRewriteNativeEndpoint({
      endpoint: "target",
      stateId: target.id,
      accessibleText: target.accessibleText,
      root: {
        kind: "power",
        occurrence: target.power,
        role: "expression",
        base: token(target.carrier, "carrier", "x"),
        exponent: {
          kind: "sequence",
          occurrence: target.exponent,
          role: "exponent",
          children: [
            token(target.numerator, "value", "2"),
            token(target.division, "operator", "/"),
            token(target.denominator, "value", "3")
          ]
        }
      }
    })
  });
  if (endpoints.source.annotated.rawLatex !== source.latex ||
    endpoints.target.annotated.rawLatex !== target.latex) {
    throw new Error(
      "Rational-exponent endpoints diverge from verified semantic states."
    );
  }
  return endpoints;
}

export const kpRationalExponentCompositionNativeEndpoints =
  createKpRationalExponentCompositionNativeEndpoints(
    kpRationalExponentCompositionExemplar
  );

function token(
  occurrence: KpRootRewriteOccurrence,
  role: "root-index" | "carrier" | "exponent" | "value" | "operator",
  latex: string
) {
  return { kind: "token" as const, occurrence, role, latex };
}
