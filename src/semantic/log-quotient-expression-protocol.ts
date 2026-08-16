import {
  defineKpExpressionNodeProtocol,
  defineKpExpressionProjection,
  projectKpExpressionTree
} from "./expression-node-protocol.ts";
import type {
  KpLogQuotientExpressionNode
} from "./log-quotient-states.ts";

export const kpLogQuotientExpressionProtocol =
  defineKpExpressionNodeProtocol<KpLogQuotientExpressionNode>({
    id: "kp.log-quotient.expression-structure.v1",
    kinds: [
      "symbol",
      "function-operator",
      "delimiter",
      "subtraction-operator",
      "fraction-bar",
      "natural-log",
      "difference",
      "quotient"
    ],
    handlers: {
      symbol: { children: () => [] },
      "function-operator": { children: () => [] },
      delimiter: { children: () => [] },
      "subtraction-operator": { children: () => [] },
      "fraction-bar": { children: () => [] },
      "natural-log": {
        children: (node) => [
          node.operator,
          node.enclosure[0],
          node.argument,
          node.enclosure[1]
        ]
      },
      difference: {
        children: (node) => [node.left, node.operator, node.right]
      },
      quotient: {
        children: (node) => [node.numerator, node.bar, node.denominator]
      }
    }
  });

export const kpLogQuotientLatexProjection =
  defineKpExpressionProjection<KpLogQuotientExpressionNode, string>({
    id: "kp.log-quotient.projection.latex.v1",
    protocol: kpLogQuotientExpressionProtocol,
    handlers: {
      symbol: { project: (node) => node.name },
      "function-operator": { project: () => "\\ln" },
      delimiter: { project: (node) => node.value },
      "subtraction-operator": { project: (node) => node.value },
      "fraction-bar": { project: () => "" },
      "natural-log": {
        project: (_node, children) =>
          `${children[0]}${children[1]}${children[2]}${children[3]}`
      },
      difference: {
        project: (_node, children) =>
          `${children[0]}${children[1]}${children[2]}`
      },
      quotient: {
        project: (_node, children) =>
          `\\frac{${children[0]}}{${children[2]}}`
      }
    }
  });

export const kpLogQuotientLabelProjection =
  defineKpExpressionProjection<KpLogQuotientExpressionNode, string>({
    id: "kp.log-quotient.projection.label.v1",
    protocol: kpLogQuotientExpressionProtocol,
    handlers: {
      symbol: { project: (node) => node.name },
      "function-operator": { project: () => "\\ln" },
      delimiter: { project: (node) => node.value },
      "subtraction-operator": { project: (node) => node.value },
      "fraction-bar": { project: () => "structural:frac-line" },
      "natural-log": { project: () => "natural-log-wrapper" },
      difference: { project: () => "log-difference" },
      quotient: { project: () => "quotient" }
    }
  });

export function renderKpLogQuotientExpressionNodeLatex(
  node: KpLogQuotientExpressionNode
): string {
  return projectKpExpressionTree(
    node,
    kpLogQuotientExpressionProtocol,
    kpLogQuotientLatexProjection
  );
}

export function labelKpLogQuotientExpressionNode(
  node: KpLogQuotientExpressionNode
): string {
  return projectKpExpressionTree(
    node,
    kpLogQuotientExpressionProtocol,
    kpLogQuotientLabelProjection
  );
}
