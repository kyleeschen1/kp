export type KpLogQuotientStateId =
  | "log-quotient.state.difference"
  | "log-quotient.state.quotient";

export type KpLogQuotientSemanticId =
  | "semantic.log-quotient.expression.difference"
  | "semantic.log-quotient.operator.subtract"
  | "semantic.log-quotient.wrapper.persistent"
  | "semantic.log-quotient.wrapper.persistent.operator"
  | "semantic.log-quotient.wrapper.persistent.open"
  | "semantic.log-quotient.wrapper.persistent.close"
  | "semantic.log-quotient.wrapper.retiring"
  | "semantic.log-quotient.wrapper.retiring.operator"
  | "semantic.log-quotient.wrapper.retiring.open"
  | "semantic.log-quotient.wrapper.retiring.close"
  | "semantic.log-quotient.variable.x"
  | "semantic.log-quotient.variable.y"
  | "semantic.log-quotient.quotient.x-over-y"
  | "semantic.log-quotient.shell.fraction-bar";

interface KpLogQuotientNodeBase {
  /** Occurrence identity is endpoint-local; semanticId carries identity across endpoints. */
  readonly id: string;
  readonly semanticId: KpLogQuotientSemanticId;
}

export type KpLogQuotientExpressionNode =
  | KpLogQuotientSymbolNode
  | KpLogQuotientFunctionOperatorNode
  | KpLogQuotientDelimiterNode
  | KpLogQuotientSubtractionOperatorNode
  | KpLogQuotientFractionBarNode
  | KpLogQuotientNaturalLogNode
  | KpLogQuotientDifferenceNode
  | KpLogQuotientQuotientNode;

export interface KpLogQuotientSymbolNode extends KpLogQuotientNodeBase {
  readonly kind: "symbol";
  readonly name: "x" | "y";
}

export interface KpLogQuotientFunctionOperatorNode extends KpLogQuotientNodeBase {
  readonly kind: "function-operator";
  readonly name: "ln";
}

export interface KpLogQuotientDelimiterNode extends KpLogQuotientNodeBase {
  readonly kind: "delimiter";
  readonly value: "(" | ")";
}

export interface KpLogQuotientSubtractionOperatorNode extends KpLogQuotientNodeBase {
  readonly kind: "subtraction-operator";
  readonly value: "-";
}

export interface KpLogQuotientFractionBarNode extends KpLogQuotientNodeBase {
  readonly kind: "fraction-bar";
}

export interface KpLogQuotientNaturalLogNode extends KpLogQuotientNodeBase {
  readonly kind: "natural-log";
  readonly operator: KpLogQuotientFunctionOperatorNode;
  readonly enclosure: readonly [
    KpLogQuotientDelimiterNode,
    KpLogQuotientDelimiterNode
  ];
  readonly argument: KpLogQuotientExpressionNode;
}

export interface KpLogQuotientDifferenceNode extends KpLogQuotientNodeBase {
  readonly kind: "difference";
  readonly left: KpLogQuotientExpressionNode;
  readonly operator: KpLogQuotientSubtractionOperatorNode;
  readonly right: KpLogQuotientExpressionNode;
}

export interface KpLogQuotientQuotientNode extends KpLogQuotientNodeBase {
  readonly kind: "quotient";
  readonly numerator: KpLogQuotientExpressionNode;
  readonly bar: KpLogQuotientFractionBarNode;
  readonly denominator: KpLogQuotientExpressionNode;
}

export interface KpLogQuotientState {
  readonly id: KpLogQuotientStateId;
  readonly kind: "log-difference" | "log-of-quotient";
  readonly latex: string;
  readonly accessibleText: string;
  readonly root: KpLogQuotientExpressionNode;
}

const source = Object.freeze({
  id: "log-quotient.state.difference" as const,
  kind: "log-difference" as const,
  latex: "\\ln(x)-\\ln(y)",
  accessibleText: "natural log of x minus natural log of y",
  root: difference(
    "source.difference",
    naturalLog(
      "source.left.log",
      "persistent",
      symbol("source.left.argument.x", "x")
    ),
    Object.freeze({
      id: "source.subtract",
      semanticId: "semantic.log-quotient.operator.subtract" as const,
      kind: "subtraction-operator" as const,
      value: "-" as const
    }),
    naturalLog(
      "source.right.log",
      "retiring",
      symbol("source.right.argument.y", "y")
    )
  )
} satisfies KpLogQuotientState);

const target = Object.freeze({
  id: "log-quotient.state.quotient" as const,
  kind: "log-of-quotient" as const,
  latex: "\\ln(\\frac{x}{y})",
  accessibleText: "natural log of x divided by y",
  root: naturalLog(
    "target.log",
    "persistent",
    quotient(
      "target.quotient",
      symbol("target.numerator.x", "x"),
      symbol("target.denominator.y", "y")
    )
  )
} satisfies KpLogQuotientState);

export const kpCanonicalLogQuotientStates = Object.freeze([
  source,
  target
] as const satisfies readonly KpLogQuotientState[]);

export function listKpLogQuotientExpressionNodes(
  state: KpLogQuotientState
): readonly KpLogQuotientExpressionNode[] {
  const nodes: KpLogQuotientExpressionNode[] = [];
  visit(state.root, (node) => nodes.push(node));
  return Object.freeze(nodes);
}

function symbol(id: string, name: "x" | "y"): KpLogQuotientSymbolNode {
  return Object.freeze({
    id,
    semanticId: `semantic.log-quotient.variable.${name}`,
    kind: "symbol",
    name
  });
}

function naturalLog(
  id: string,
  lineage: "persistent" | "retiring",
  argument: KpLogQuotientExpressionNode
): KpLogQuotientNaturalLogNode {
  const prefix = `semantic.log-quotient.wrapper.${lineage}` as const;
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

function difference(
  id: string,
  left: KpLogQuotientExpressionNode,
  operator: KpLogQuotientSubtractionOperatorNode,
  right: KpLogQuotientExpressionNode
): KpLogQuotientDifferenceNode {
  return Object.freeze({
    id,
    semanticId: "semantic.log-quotient.expression.difference",
    kind: "difference",
    left,
    operator,
    right
  });
}

function quotient(
  id: string,
  numerator: KpLogQuotientExpressionNode,
  denominator: KpLogQuotientExpressionNode
): KpLogQuotientQuotientNode {
  return Object.freeze({
    id,
    semanticId: "semantic.log-quotient.quotient.x-over-y",
    kind: "quotient",
    numerator,
    bar: Object.freeze({
      id: `${id}.bar`,
      semanticId: "semantic.log-quotient.shell.fraction-bar",
      kind: "fraction-bar"
    }),
    denominator
  });
}

function visit(
  node: KpLogQuotientExpressionNode,
  callback: (node: KpLogQuotientExpressionNode) => void
): void {
  callback(node);
  switch (node.kind) {
    case "symbol":
    case "function-operator":
    case "delimiter":
    case "subtraction-operator":
    case "fraction-bar":
      return;
    case "natural-log":
      visit(node.operator, callback);
      node.enclosure.forEach((delimiter) => visit(delimiter, callback));
      visit(node.argument, callback);
      return;
    case "difference":
      visit(node.left, callback);
      visit(node.operator, callback);
      visit(node.right, callback);
      return;
    case "quotient":
      visit(node.numerator, callback);
      visit(node.bar, callback);
      visit(node.denominator, callback);
      return;
  }
}
