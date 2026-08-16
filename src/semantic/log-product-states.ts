import { listKpExpressionNodes } from "./expression-node-protocol.ts";
import {
  kpLogProductExpressionProtocol
} from "./log-product-expression-protocol.ts";

export type KpLogProductStateId =
  | "log-product.state.product"
  | "log-product.state.sum";

export type KpLogProductSemanticId =
  | "semantic.log-product.wrapper.source"
  | "semantic.log-product.wrapper.source.operator"
  | "semantic.log-product.wrapper.source.open"
  | "semantic.log-product.wrapper.source.close"
  | "semantic.log-product.product.xy"
  | "semantic.log-product.variable.x"
  | "semantic.log-product.variable.y"
  | "semantic.log-product.sum.logs"
  | "semantic.log-product.connector.plus"
  | "semantic.log-product.wrapper.target-left"
  | "semantic.log-product.wrapper.target-left.operator"
  | "semantic.log-product.wrapper.target-left.open"
  | "semantic.log-product.wrapper.target-left.close"
  | "semantic.log-product.wrapper.target-right"
  | "semantic.log-product.wrapper.target-right.operator"
  | "semantic.log-product.wrapper.target-right.open"
  | "semantic.log-product.wrapper.target-right.close";

interface KpLogProductNodeBase {
  readonly id: string;
  readonly semanticId: KpLogProductSemanticId;
}

export type KpLogProductExpressionNode =
  | KpLogProductSymbolNode
  | KpLogProductFunctionOperatorNode
  | KpLogProductDelimiterNode
  | KpLogProductPlusNode
  | KpLogProductNaturalLogNode
  | KpLogProductProductNode
  | KpLogProductSumNode;

export interface KpLogProductSymbolNode extends KpLogProductNodeBase {
  readonly kind: "symbol";
  readonly name: "x" | "y";
}

export interface KpLogProductFunctionOperatorNode extends KpLogProductNodeBase {
  readonly kind: "function-operator";
  readonly name: "ln";
}

export interface KpLogProductDelimiterNode extends KpLogProductNodeBase {
  readonly kind: "delimiter";
  readonly value: "(" | ")";
}

export interface KpLogProductPlusNode extends KpLogProductNodeBase {
  readonly kind: "plus-operator";
  readonly value: "+";
}

export interface KpLogProductNaturalLogNode extends KpLogProductNodeBase {
  readonly kind: "natural-log";
  readonly operator: KpLogProductFunctionOperatorNode;
  readonly enclosure: readonly [
    KpLogProductDelimiterNode,
    KpLogProductDelimiterNode
  ];
  readonly argument: KpLogProductExpressionNode;
}

export interface KpLogProductProductNode extends KpLogProductNodeBase {
  readonly kind: "implicit-product";
  readonly factors: readonly [
    KpLogProductExpressionNode,
    KpLogProductExpressionNode
  ];
}

export interface KpLogProductSumNode extends KpLogProductNodeBase {
  readonly kind: "sum";
  readonly left: KpLogProductExpressionNode;
  readonly connector: KpLogProductPlusNode;
  readonly right: KpLogProductExpressionNode;
}

export interface KpLogProductState {
  readonly id: KpLogProductStateId;
  readonly kind: "log-of-product" | "sum-of-logs";
  readonly latex: "\\ln(xy)" | "\\ln(x)+\\ln(y)";
  readonly accessibleText:
    | "natural log of x times y"
    | "natural log of x plus natural log of y";
  readonly root: KpLogProductExpressionNode;
}

const source = Object.freeze({
  id: "log-product.state.product" as const,
  kind: "log-of-product" as const,
  latex: "\\ln(xy)" as const,
  accessibleText: "natural log of x times y" as const,
  root: naturalLog(
    "source.log",
    "source",
    product(
      "source.product",
      symbol("source.product.x", "x"),
      symbol("source.product.y", "y")
    )
  )
} satisfies KpLogProductState);

const target = Object.freeze({
  id: "log-product.state.sum" as const,
  kind: "sum-of-logs" as const,
  latex: "\\ln(x)+\\ln(y)" as const,
  accessibleText: "natural log of x plus natural log of y" as const,
  root: sum(
    "target.sum",
    naturalLog(
      "target.left.log",
      "target-left",
      symbol("target.left.argument.x", "x")
    ),
    naturalLog(
      "target.right.log",
      "target-right",
      symbol("target.right.argument.y", "y")
    )
  )
} satisfies KpLogProductState);

export const kpCanonicalLogProductStates = Object.freeze([
  source,
  target
] as const satisfies readonly KpLogProductState[]);

export function listKpLogProductExpressionNodes(
  state: KpLogProductState
): readonly KpLogProductExpressionNode[] {
  return listKpExpressionNodes(state.root, kpLogProductExpressionProtocol);
}

function symbol(
  id: string,
  name: "x" | "y"
): KpLogProductSymbolNode {
  return Object.freeze({
    id,
    semanticId: `semantic.log-product.variable.${name}`,
    kind: "symbol",
    name
  });
}

function naturalLog(
  id: string,
  lineage: "source" | "target-left" | "target-right",
  argument: KpLogProductExpressionNode
): KpLogProductNaturalLogNode {
  const prefix = `semantic.log-product.wrapper.${lineage}` as const;
  return Object.freeze({
    id,
    semanticId: prefix,
    kind: "natural-log",
    operator: Object.freeze({
      id: `${id}.operator`,
      semanticId: `${prefix}.operator`,
      kind: "function-operator" as const,
      name: "ln" as const
    }),
    enclosure: Object.freeze([
      Object.freeze({
        id: `${id}.open`,
        semanticId: `${prefix}.open`,
        kind: "delimiter" as const,
        value: "(" as const
      }),
      Object.freeze({
        id: `${id}.close`,
        semanticId: `${prefix}.close`,
        kind: "delimiter" as const,
        value: ")" as const
      })
    ] as const),
    argument
  });
}

function product(
  id: string,
  left: KpLogProductExpressionNode,
  right: KpLogProductExpressionNode
): KpLogProductProductNode {
  return Object.freeze({
    id,
    semanticId: "semantic.log-product.product.xy",
    kind: "implicit-product",
    factors: Object.freeze([left, right] as const)
  });
}

function sum(
  id: string,
  left: KpLogProductExpressionNode,
  right: KpLogProductExpressionNode
): KpLogProductSumNode {
  return Object.freeze({
    id,
    semanticId: "semantic.log-product.sum.logs",
    kind: "sum",
    left,
    connector: Object.freeze({
      id: `${id}.plus`,
      semanticId: "semantic.log-product.connector.plus",
      kind: "plus-operator",
      value: "+"
    }),
    right
  });
}
