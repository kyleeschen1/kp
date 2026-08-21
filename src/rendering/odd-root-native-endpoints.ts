import {
  isKpVerifiedOddRootSolveExemplar,
  kpOddRootSolveExemplar,
  type KpOddRootSourceState,
  type KpOddRootTargetState,
  type KpVerifiedOddRootSolveExemplar
} from "../semantic/odd-root-solve-exemplar.ts";
import {
  createKpRootRewriteNativeEndpoint,
  type KpRootRewriteEndpointExpressionNode,
  type KpRootRewriteNativeEndpoint
} from "./root-rewrite-native-endpoint.ts";

export interface KpOddRootNativeEndpointSet {
  readonly exemplar: KpVerifiedOddRootSolveExemplar;
  readonly source: KpRootRewriteNativeEndpoint;
  readonly target: KpRootRewriteNativeEndpoint;
}

export function createKpOddRootNativeEndpoints(
  exemplar: KpVerifiedOddRootSolveExemplar
): KpOddRootNativeEndpointSet {
  if (!isKpVerifiedOddRootSolveExemplar(exemplar)) {
    throw new Error("Odd-root endpoints require a verified exemplar.");
  }
  const [source, target] = exemplar.states;
  const endpoints = Object.freeze({
    exemplar,
    source: createKpRootRewriteNativeEndpoint({
      endpoint: "source",
      stateId: source.id,
      accessibleText: source.accessibleText,
      root: sourceTree(source)
    }),
    target: createKpRootRewriteNativeEndpoint({
      endpoint: "target",
      stateId: target.id,
      accessibleText: target.accessibleText,
      root: targetTree(target)
    })
  });
  if (endpoints.source.annotated.rawLatex !== source.latex ||
    endpoints.target.annotated.rawLatex !== target.latex) {
    throw new Error("Odd-root endpoints diverge from verified semantic states.");
  }
  return endpoints;
}

export const kpOddRootNativeEndpoints = createKpOddRootNativeEndpoints(
  kpOddRootSolveExemplar
);

function sourceTree(
  state: KpOddRootSourceState
): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "sequence",
    occurrence: state.expression,
    role: "expression",
    children: [{
      kind: "power",
      occurrence: state.power,
      role: "expression",
      base: token(state.subject, "carrier", "x"),
      exponent: token(state.exponent, "exponent", "3")
    }, token(state.relation, "operator", "="),
    token(state.right, "value", "8")]
  };
}

function targetTree(
  state: KpOddRootTargetState
): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "sequence",
    occurrence: state.expression,
    role: "expression",
    children: [token(state.subject, "carrier", "x"),
      token(state.relation, "operator", "="), {
        kind: "sequence",
        occurrence: state.rootExpression,
        role: "expression",
        children: [{
          kind: "radical",
          occurrence: state.radical,
          role: "radical",
          index: token(state.rootIndex, "root-index", "3"),
          radicand: token(state.radicand, "radicand", "8")
        }]
      }]
  };
}

function token(
  occurrence: KpOddRootSourceState["subject"],
  role: "carrier" | "exponent" | "operator" | "value" | "root-index" |
    "radicand",
  latex: string
): KpRootRewriteEndpointExpressionNode {
  return { kind: "token", occurrence, role, latex };
}
