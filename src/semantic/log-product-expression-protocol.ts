import {
  defineKpExpressionNodeProtocol,
  defineKpExpressionProjection,
  projectKpExpressionTree
} from "./expression-node-protocol.ts";
import type {
  KpLogProductExpressionNode
} from "./log-product-states.ts";

export const kpLogProductExpressionProtocol =
  defineKpExpressionNodeProtocol<KpLogProductExpressionNode>({
    id: "kp.log-product.expression-structure.v1",
    kinds: [
      "symbol",
      "function-operator",
      "delimiter",
      "plus-operator",
      "natural-log",
      "implicit-product",
      "sum"
    ],
    handlers: {
      symbol: { children: () => [] },
      "function-operator": { children: () => [] },
      delimiter: { children: () => [] },
      "plus-operator": { children: () => [] },
      "natural-log": {
        children: (node) => [
          node.operator,
          node.enclosure[0],
          node.argument,
          node.enclosure[1]
        ]
      },
      "implicit-product": { children: (node) => node.factors },
      sum: {
        children: (node) => [node.left, node.connector, node.right]
      }
    }
  });

export const kpLogProductLatexProjection =
  defineKpExpressionProjection<KpLogProductExpressionNode, string>({
    id: "kp.log-product.projection.latex.v1",
    protocol: kpLogProductExpressionProtocol,
    handlers: {
      symbol: { project: (node) => node.name },
      "function-operator": { project: () => "\\ln" },
      delimiter: { project: (node) => node.value },
      "plus-operator": { project: (node) => node.value },
      "natural-log": {
        project: (_node, children) =>
          `${children[0]}${children[1]}${children[2]}${children[3]}`
      },
      "implicit-product": {
        project: (_node, children) => children.join("")
      },
      sum: {
        project: (_node, children) =>
          `${children[0]}${children[1]}${children[2]}`
      }
    }
  });

export const kpLogProductLabelProjection =
  defineKpExpressionProjection<KpLogProductExpressionNode, string>({
    id: "kp.log-product.projection.label.v1",
    protocol: kpLogProductExpressionProtocol,
    handlers: {
      symbol: { project: (node) => node.name },
      "function-operator": { project: () => "\\ln" },
      delimiter: { project: (node) => node.value },
      "plus-operator": { project: (node) => node.value },
      "natural-log": { project: () => "natural-log-wrapper" },
      "implicit-product": { project: () => "implicit-product" },
      sum: { project: () => "log-sum" }
    }
  });

export function renderKpLogProductExpressionNodeLatex(
  node: KpLogProductExpressionNode
): string {
  return projectKpExpressionTree(
    node,
    kpLogProductExpressionProtocol,
    kpLogProductLatexProjection
  );
}

export function labelKpLogProductExpressionNode(
  node: KpLogProductExpressionNode
): string {
  return projectKpExpressionTree(
    node,
    kpLogProductExpressionProtocol,
    kpLogProductLabelProjection
  );
}
