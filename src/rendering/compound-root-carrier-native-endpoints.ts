import {
  isKpVerifiedCompoundRootCarrierExemplar,
  kpCompoundRootCarrierExemplar,
  type KpCompoundRootCarrierSourceState,
  type KpCompoundRootCarrierTargetState,
  type KpVerifiedCompoundRootCarrierExemplar
} from "../semantic/compound-root-carrier-exemplar.ts";
import type { KpRootSemanticSubtreeNode } from
  "../semantic/root-persistent-subtree-certificate.ts";
import {
  createKpRootRewriteNativeEndpoint,
  type KpRootRewriteEndpointExpressionNode,
  type KpRootRewriteNativeEndpoint
} from "./root-rewrite-native-endpoint.ts";

export interface KpCompoundRootCarrierNativeEndpointSet {
  readonly exemplar: KpVerifiedCompoundRootCarrierExemplar;
  readonly source: KpRootRewriteNativeEndpoint;
  readonly target: KpRootRewriteNativeEndpoint;
}

const carrierLatexBySemanticId = Object.freeze({
  "semantic.variable.x": "x",
  "semantic.operator.plus": "+",
  "semantic.value.one": "1"
} as const);

export function createKpCompoundRootCarrierNativeEndpoints(
  exemplar: KpVerifiedCompoundRootCarrierExemplar
): KpCompoundRootCarrierNativeEndpointSet {
  if (!isKpVerifiedCompoundRootCarrierExemplar(exemplar)) {
    throw new Error("Compound-root endpoints require a verified exemplar.");
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
    throw new Error(
      "Compound-root Native endpoints diverge from verified semantic states."
    );
  }
  return endpoints;
}

export const kpCompoundRootCarrierNativeEndpoints =
  createKpCompoundRootCarrierNativeEndpoints(kpCompoundRootCarrierExemplar);

function sourceTree(
  state: KpCompoundRootCarrierSourceState
): KpRootRewriteEndpointExpressionNode {
  const carrier = carrierTree(state.carrier);
  const grouping: KpRootRewriteEndpointExpressionNode = {
    kind: "parenthesized",
    occurrence: state.grouping,
    role: "enclosure",
    body: carrier
  };
  const exponent: KpRootRewriteEndpointExpressionNode = {
    kind: "token",
    occurrence: state.exponent,
    role: "exponent",
    latex: "2"
  };
  const power: KpRootRewriteEndpointExpressionNode = {
    kind: "power",
    occurrence: state.power,
    role: "radicand",
    base: grouping,
    exponent
  };
  const radicand: KpRootRewriteEndpointExpressionNode = {
    kind: "sequence",
    occurrence: state.radicand,
    role: "radicand",
    children: [power]
  };
  return {
    kind: "radical",
    occurrence: state.radical,
    role: "radical",
    radicand
  };
}

function targetTree(
  state: KpCompoundRootCarrierTargetState
): KpRootRewriteEndpointExpressionNode {
  return {
    kind: "sequence",
    occurrence: state.absoluteValue,
    role: "enclosure",
    children: [{
      kind: "token",
      occurrence: state.leadingDelimiter,
      role: "enclosure-leading",
      latex: "\\lvert"
    }, carrierTree(state.carrier), {
      kind: "token",
      occurrence: state.trailingDelimiter,
      role: "enclosure-trailing",
      latex: "\\rvert"
    }]
  };
}

function carrierTree(
  node: KpRootSemanticSubtreeNode
): KpRootRewriteEndpointExpressionNode {
  if (node.children.length === 0) {
    const latex = carrierLatexBySemanticId[
      node.occurrence.semanticId as keyof typeof carrierLatexBySemanticId
    ];
    if (latex === undefined) {
      throw new Error(
        `Compound-root carrier has no LaTeX for ${node.occurrence.semanticId}.`
      );
    }
    return {
      kind: "token",
      occurrence: node.occurrence,
      role: node.occurrence.subtreeKind === "operator"
        ? "operator"
        : node.occurrence.subtreeKind === "value"
          ? "value"
          : "carrier",
      latex
    };
  }
  return {
    kind: "sequence",
    occurrence: node.occurrence,
    role: "carrier",
    children: node.children.map(carrierTree)
  };
}

