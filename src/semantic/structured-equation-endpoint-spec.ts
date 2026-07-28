import type {
  KpFractionSolveEquationState
} from "./fraction-solve-macro.ts";
import type {
  KpStructuredExpressionNode
} from "./structured-expression.ts";

export type KpStructuredEquationEndpointSegment =
  | { readonly kind: "latex"; readonly latex: string }
  | { readonly kind: "selector"; readonly selectorId: string; readonly latex: string };

export interface KpStructuredEquationGroupEnvelope {
  readonly id: string;
  readonly memberSelectorIds: readonly string[];
  readonly structuralAnchorIds?: readonly string[] | undefined;
}

export interface KpStructuredEquationStructuralAnchor {
  readonly id: string;
  readonly kind: "fraction-rule";
  readonly ownerNodeId: string;
}

export interface KpStructuredEquationEndpointSpec {
  readonly stateId: string;
  readonly label: string;
  readonly segments: readonly KpStructuredEquationEndpointSegment[];
  readonly selectorIds: readonly string[];
  readonly groupEnvelopes: readonly KpStructuredEquationGroupEnvelope[];
  readonly structuralAnchors: readonly KpStructuredEquationStructuralAnchor[];
}

interface RenderedNode {
  readonly segments: readonly KpStructuredEquationEndpointSegment[];
  readonly selectorIds: readonly string[];
  readonly groups: readonly KpStructuredEquationGroupEnvelope[];
  readonly structuralAnchors: readonly KpStructuredEquationStructuralAnchor[];
}

export function createKpStructuredEquationEndpointSpec(
  state: KpFractionSolveEquationState
): KpStructuredEquationEndpointSpec {
  const left = renderNode(state.left.root, "equation");
  const right = renderNode(state.right.root, "equation");
  const equalsId = `${state.id}.equals`;
  const segments = [
    ...left.segments,
    gap(),
    token(equalsId, "="),
    gap(),
    ...right.segments
  ];
  const selectorIds = [...left.selectorIds, equalsId, ...right.selectorIds];
  return Object.freeze({
    stateId: state.id,
    label: `Equation ${segments.map(({ latex }) => latex).join("")}`,
    segments: Object.freeze(segments),
    selectorIds: Object.freeze(selectorIds),
    groupEnvelopes: Object.freeze([
      ...left.groups,
      ...right.groups,
      Object.freeze({
        id: `${state.id}.left-side`,
        memberSelectorIds: Object.freeze([...left.selectorIds]),
        structuralAnchorIds: Object.freeze(
          left.structuralAnchors.map(({ id }) => id)
        )
      }),
      Object.freeze({
        id: `${state.id}.right-relation`,
        memberSelectorIds: Object.freeze([equalsId, ...right.selectorIds]),
        structuralAnchorIds: Object.freeze(
          right.structuralAnchors.map(({ id }) => id)
        )
      }),
      Object.freeze({
        id: `${state.id}.equation`,
        memberSelectorIds: Object.freeze(selectorIds),
        structuralAnchorIds: Object.freeze([
          ...left.structuralAnchors,
          ...right.structuralAnchors
        ].map(({ id }) => id))
      })
    ]),
    structuralAnchors: Object.freeze([
      ...left.structuralAnchors,
      ...right.structuralAnchors
    ])
  });
}

function renderNode(
  node: KpStructuredExpressionNode,
  context: "equation" | "product" | "fraction" | "power"
): RenderedNode {
  switch (node.kind) {
    case "number":
      return renderedLeaf(node.id, String(node.value));
    case "symbol":
      return renderedLeaf(node.id, node.name);
    case "negate": {
      const value = renderNode(node.value, context);
      const minusId = `${node.id}.minus`;
      return renderedComposite(node.id, [
        token(minusId, "-"),
        gap(),
        ...value.segments
      ], [minusId, ...value.selectorIds], [value]);
    }
    case "sum": {
      const children = node.terms.map((term) => renderNode(term, "equation"));
      const segments: KpStructuredEquationEndpointSegment[] = [];
      const selectorIds: string[] = [];
      if (context === "product") {
        const leftParenId = `${node.id}.left-parenthesis`;
        segments.push(token(leftParenId, "("), gap());
        selectorIds.push(leftParenId);
      }
      children.forEach((child, index) => {
        if (index > 0 && node.terms[index]?.kind !== "negate") {
          const operatorId = `${node.id}.operator.${index}`;
          segments.push(gap(), token(operatorId, "+"), gap());
          selectorIds.push(operatorId);
        } else if (index > 0) {
          segments.push(gap());
        }
        segments.push(...child.segments);
        selectorIds.push(...child.selectorIds);
      });
      if (context === "product") {
        const rightParenId = `${node.id}.right-parenthesis`;
        segments.push(gap(), token(rightParenId, ")"));
        selectorIds.push(rightParenId);
      }
      return renderedComposite(node.id, segments, selectorIds, children);
    }
    case "product": {
      const children = node.factors.map((factor) => renderNode(factor, "product"));
      const segments: KpStructuredEquationEndpointSegment[] = [];
      const selectorIds: string[] = [];
      children.forEach((child, index) => {
        if (index > 0) {
          if (usesImplicitProduct(node.factors[index - 1]!, node.factors[index]!)) {
            segments.push(gap());
          } else {
            const operatorId = `${node.id}.operator.${index}`;
            segments.push(gap(), token(operatorId, "\\cdot"), gap());
            selectorIds.push(operatorId);
          }
        }
        segments.push(...child.segments);
        selectorIds.push(...child.selectorIds);
      });
      return renderedComposite(node.id, segments, selectorIds, children);
    }
    case "quotient": {
      const numerator = renderNode(node.numerator, "fraction");
      const denominator = renderNode(node.denominator, "fraction");
      const structuralAnchor = Object.freeze({
        id: `${node.id}.fraction-rule`,
        kind: "fraction-rule" as const,
        ownerNodeId: node.id
      });
      return renderedComposite(node.id, [
        latex("\\frac{"),
        ...numerator.segments,
        latex("}{"),
        ...denominator.segments,
        latex("}")
      ], [...numerator.selectorIds, ...denominator.selectorIds], [numerator, denominator],
      [structuralAnchor]);
    }
    case "power": {
      const base = renderNode(node.base, "power");
      const exponent = renderNode(node.exponent, "power");
      return renderedComposite(node.id, [
        ...base.segments,
        latex("^{"),
        ...exponent.segments,
        latex("}")
      ], [...base.selectorIds, ...exponent.selectorIds], [base, exponent]);
    }
  }
}

function renderedLeaf(id: string, value: string): RenderedNode {
  return {
    segments: [token(id, value)],
    selectorIds: [id],
    groups: [],
    structuralAnchors: []
  };
}

function renderedComposite(
  id: string,
  segments: readonly KpStructuredEquationEndpointSegment[],
  selectorIds: readonly string[],
  children: readonly RenderedNode[],
  ownAnchors: readonly KpStructuredEquationStructuralAnchor[] = []
): RenderedNode {
  return {
    segments,
    selectorIds,
    groups: [
      ...children.flatMap(({ groups }) => groups),
      { id, memberSelectorIds: selectorIds }
    ],
    structuralAnchors: [
      ...ownAnchors,
      ...children.flatMap(({ structuralAnchors }) => structuralAnchors)
    ]
  };
}

function usesImplicitProduct(
  left: KpStructuredExpressionNode,
  right: KpStructuredExpressionNode
): boolean {
  return (
    (left.kind === "number" && right.kind === "symbol") ||
    (left.kind === "quotient" && right.kind === "sum") ||
    right.kind === "sum"
  );
}

function token(selectorId: string, value: string): KpStructuredEquationEndpointSegment {
  return { kind: "selector", selectorId, latex: value };
}

function latex(value: string): KpStructuredEquationEndpointSegment {
  return { kind: "latex", latex: value };
}

function gap(): KpStructuredEquationEndpointSegment {
  return latex("\\;");
}
