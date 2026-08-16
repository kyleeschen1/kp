import {
  defineKpExpressionNodeProtocol,
  defineKpExpressionProjection,
  projectKpExpressionTree
} from "./expression-node-protocol.ts";
import type {
  KpLogExponentExpressionNode
} from "./log-exponent-solve-states.ts";

export const kpLogExponentExpressionProtocol =
  defineKpExpressionNodeProtocol<KpLogExponentExpressionNode>({
    id: "kp.log-exponent.expression-structure.v1",
    kinds: [
      "number",
      "symbol",
      "function-operator",
      "delimiter",
      "power",
      "natural-log",
      "product",
      "quotient",
      "equality"
    ],
    handlers: {
      number: { children: () => [] },
      symbol: { children: () => [] },
      "function-operator": { children: () => [] },
      delimiter: { children: () => [] },
      power: { children: (node) => [node.base, node.exponent] },
      "natural-log": {
        children: (node) => node.enclosure === undefined
          ? [node.operator, node.argument]
          : [
              node.operator,
              node.enclosure[0],
              node.argument,
              node.enclosure[1]
            ]
      },
      product: { children: (node) => node.factors },
      quotient: {
        children: (node) => [node.numerator, node.denominator]
      },
      equality: { children: (node) => [node.left, node.right] }
    }
  });

export const kpLogExponentLatexProjection =
  defineKpExpressionProjection<KpLogExponentExpressionNode, string>({
    id: "kp.log-exponent.projection.latex.v1",
    protocol: kpLogExponentExpressionProtocol,
    handlers: {
      number: { project: (node) => String(node.value) },
      symbol: { project: (node) => node.name },
      "function-operator": { project: () => "\\ln" },
      delimiter: { project: (node) => node.value },
      power: {
        project: (_node, children) => `${children[0]}^${children[1]}`
      },
      "natural-log": {
        project: (node, children) => node.enclosure === undefined
          ? `${children[0]} ${children[1]}`
          : `${children[0]}${children[1]}${children[2]}${children[3]}`
      },
      product: { project: (_node, children) => children.join("") },
      quotient: {
        project: (_node, children) =>
          `\\frac{${children[0]}}{${children[1]}}`
      },
      equality: {
        project: (_node, children) => `${children[0]}=${children[1]}`
      }
    }
  });

export function renderKpLogExponentExpressionNodeLatex(
  node: KpLogExponentExpressionNode
): string {
  return projectKpExpressionTree(
    node,
    kpLogExponentExpressionProtocol,
    kpLogExponentLatexProjection
  );
}
