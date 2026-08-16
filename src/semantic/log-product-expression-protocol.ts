import {
  defineKpExpressionNodeProtocol
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
