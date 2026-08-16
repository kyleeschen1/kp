import {
  defineKpExpressionNodeProtocol,
  defineKpExpressionProjection,
  projectKpExpressionTree
} from "./expression-node-protocol.ts";
import type {
  KpStructuredExpressionNode
} from "./structured-expression.ts";

export const kpStructuredExpressionProtocol =
  defineKpExpressionNodeProtocol<KpStructuredExpressionNode>({
    id: "kp.structured-expression.structure.v1",
    kinds: [
      "number",
      "symbol",
      "sum",
      "product",
      "quotient",
      "power",
      "negate"
    ],
    handlers: {
      number: { children: () => [] },
      symbol: { children: () => [] },
      sum: { children: (node) => node.terms },
      product: { children: (node) => node.factors },
      quotient: {
        children: (node) => [node.numerator, node.denominator]
      },
      power: { children: (node) => [node.base, node.exponent] },
      negate: { children: (node) => [node.value] }
    }
  });

export const kpStructuredExpressionAccessibleTextProjection =
  defineKpExpressionProjection<KpStructuredExpressionNode, string>({
    id: "kp.structured-expression.projection.accessible-text.v1",
    protocol: kpStructuredExpressionProtocol,
    handlers: {
      number: { project: (node) => String(node.value) },
      symbol: { project: (node) => node.name },
      negate: { project: (_node, children) => `negative ${children[0]}` },
      sum: {
        project: (node, children) => children.map((child, index) => {
          if (index === 0) return child;
          const term = node.terms[index]!;
          return term.kind === "negate"
            ? `minus ${stripNegativePrefix(child)}`
            : `plus ${child}`;
        }).join(" ")
      },
      product: {
        project: (node, children) => children.map((child, index) =>
          node.factors[index]!.kind === "sum"
            ? `the quantity ${child}`
            : child
        ).join(" times ")
      },
      quotient: {
        project: (_node, children) =>
          `${children[0]} divided by ${children[1]}`
      },
      power: {
        project: (_node, children) =>
          `${children[0]} to the power ${children[1]}`
      }
    }
  });

export function projectKpStructuredExpressionAccessibleText(
  node: KpStructuredExpressionNode
): string {
  return projectKpExpressionTree(
    node,
    kpStructuredExpressionProtocol,
    kpStructuredExpressionAccessibleTextProjection
  );
}

function stripNegativePrefix(value: string): string {
  const prefix = "negative ";
  return value.startsWith(prefix) ? value.slice(prefix.length) : value;
}
