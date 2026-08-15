export type KpLogExponentSolveStateId =
  | "log-exponent.state.source"
  | "log-exponent.state.logged-both-sides"
  | "log-exponent.state.exponent-extracted"
  | "log-exponent.state.solved";

export type KpLogExponentSolveStateKind =
  | "source-equation"
  | "logged-both-sides"
  | "exponent-extracted"
  | "solved-equation";

interface KpLogExponentNodeBase {
  /** Occurrence identity is state-local; semanticId carries identity across states. */
  readonly id: string;
  readonly semanticId: string;
}

export type KpLogExponentExpressionNode =
  | KpLogExponentNumberNode
  | KpLogExponentSymbolNode
  | KpLogExponentFunctionOperatorNode
  | KpLogExponentDelimiterNode
  | KpLogExponentPowerNode
  | KpLogExponentNaturalLogNode
  | KpLogExponentProductNode
  | KpLogExponentQuotientNode
  | KpLogExponentEqualityNode;

export interface KpLogExponentNumberNode extends KpLogExponentNodeBase {
  readonly kind: "number";
  readonly value: number;
}

export interface KpLogExponentSymbolNode extends KpLogExponentNodeBase {
  readonly kind: "symbol";
  readonly name: string;
}

export interface KpLogExponentFunctionOperatorNode
  extends KpLogExponentNodeBase {
  readonly kind: "function-operator";
  readonly name: "ln";
}

export interface KpLogExponentDelimiterNode extends KpLogExponentNodeBase {
  readonly kind: "delimiter";
  readonly value: "(" | ")";
}

export interface KpLogExponentPowerNode extends KpLogExponentNodeBase {
  readonly kind: "power";
  readonly base: KpLogExponentExpressionNode;
  readonly exponent: KpLogExponentExpressionNode;
}

export interface KpLogExponentNaturalLogNode extends KpLogExponentNodeBase {
  readonly kind: "natural-log";
  readonly operator: KpLogExponentFunctionOperatorNode;
  readonly enclosure?: readonly [
    KpLogExponentDelimiterNode,
    KpLogExponentDelimiterNode
  ] | undefined;
  readonly argument: KpLogExponentExpressionNode;
}

export interface KpLogExponentProductNode extends KpLogExponentNodeBase {
  readonly kind: "product";
  readonly factors: readonly KpLogExponentExpressionNode[];
}

export interface KpLogExponentQuotientNode extends KpLogExponentNodeBase {
  readonly kind: "quotient";
  readonly numerator: KpLogExponentExpressionNode;
  readonly denominator: KpLogExponentExpressionNode;
}

export interface KpLogExponentEqualityNode extends KpLogExponentNodeBase {
  readonly kind: "equality";
  readonly left: KpLogExponentExpressionNode;
  readonly right: KpLogExponentExpressionNode;
}

export interface KpLogExponentSolveState {
  readonly id: KpLogExponentSolveStateId;
  readonly kind: KpLogExponentSolveStateKind;
  readonly latex: string;
  readonly equation: KpLogExponentEqualityNode;
}

export const kpCanonicalLogExponentSolveStates = Object.freeze([
  state(
    "source",
    "source-equation",
    "2^x=7",
    equality("source", power("source.left", two("source.base"), x("source.exponent")), seven("source.right"))
  ),
  state(
    "logged-both-sides",
    "logged-both-sides",
    "\\ln(2^x)=\\ln 7",
    equality(
      "logged",
      naturalLog(
        "logged.left.log",
        "semantic.expression.log-two-power-x",
        lnOperator("logged.left.log.operator", "semantic.operator.ln.left-lineage"),
        power("logged.left.power", two("logged.base"), x("logged.exponent")),
        logEnclosure("logged.left.log")
      ),
      naturalLog(
        "logged.right.log",
        "semantic.value.log-seven",
        lnOperator("logged.right.log.operator", "semantic.operator.ln.right-lineage"),
        seven("logged.right")
      )
    )
  ),
  state(
    "exponent-extracted",
    "exponent-extracted",
    "x\\ln 2=\\ln 7",
    equality(
      "extracted",
      product("extracted.left", [
        x("extracted.coefficient"),
        naturalLog(
          "extracted.left.log",
          "semantic.value.log-two",
          lnOperator("extracted.left.log.operator", "semantic.operator.ln.left-lineage"),
          two("extracted.base")
        )
      ]),
      naturalLog(
        "extracted.right.log",
        "semantic.value.log-seven",
        lnOperator("extracted.right.log.operator", "semantic.operator.ln.right-lineage"),
        seven("extracted.right")
      )
    )
  ),
  state(
    "solved",
    "solved-equation",
    "x=\\frac{\\ln 7}{\\ln 2}",
    equality(
      "solved",
      x("solved.left"),
      quotient(
        "solved.right",
        naturalLog(
          "solved.numerator.log",
          "semantic.value.log-seven",
          lnOperator("solved.numerator.log.operator", "semantic.operator.ln.right-lineage"),
          seven("solved.numerator")
        ),
        naturalLog(
          "solved.denominator.log",
          "semantic.value.log-two",
          lnOperator("solved.denominator.log.operator", "semantic.operator.ln.left-lineage"),
          two("solved.denominator")
        )
      )
    )
  )
] as const satisfies readonly KpLogExponentSolveState[]);

export function listKpLogExponentExpressionNodes(
  state: KpLogExponentSolveState
): readonly KpLogExponentExpressionNode[] {
  const nodes: KpLogExponentExpressionNode[] = [];
  visit(state.equation, (node) => nodes.push(node));
  return Object.freeze(nodes);
}

function state(
  suffix: "source" | "logged-both-sides" | "exponent-extracted" | "solved",
  kind: KpLogExponentSolveStateKind,
  latex: string,
  equation: KpLogExponentEqualityNode
): KpLogExponentSolveState {
  return Object.freeze({
    id: `log-exponent.state.${suffix}` as KpLogExponentSolveStateId,
    kind,
    latex,
    equation
  });
}

function equality(suffix: string, left: KpLogExponentExpressionNode, right: KpLogExponentExpressionNode): KpLogExponentEqualityNode {
  return Object.freeze({ id: `${suffix}.equality`, semanticId: "semantic.equality", kind: "equality", left, right });
}

function two(id: string): KpLogExponentNumberNode {
  return Object.freeze({ id, semanticId: "semantic.base.two", kind: "number", value: 2 });
}

function seven(id: string): KpLogExponentNumberNode {
  return Object.freeze({ id, semanticId: "semantic.value.seven", kind: "number", value: 7 });
}

function x(id: string): KpLogExponentSymbolNode {
  return Object.freeze({ id, semanticId: "semantic.unknown.x", kind: "symbol", name: "x" });
}

function lnOperator(
  id: string,
  semanticId:
    | "semantic.operator.ln.left-lineage"
    | "semantic.operator.ln.right-lineage"
): KpLogExponentFunctionOperatorNode {
  return Object.freeze({ id, semanticId, kind: "function-operator", name: "ln" });
}

function logEnclosure(idPrefix: string): readonly [
  KpLogExponentDelimiterNode,
  KpLogExponentDelimiterNode
] {
  return Object.freeze([
    Object.freeze({
      id: `${idPrefix}.open`,
      semanticId: "semantic.shell.log-left.open",
      kind: "delimiter" as const,
      value: "(" as const
    }),
    Object.freeze({
      id: `${idPrefix}.close`,
      semanticId: "semantic.shell.log-left.close",
      kind: "delimiter" as const,
      value: ")" as const
    })
  ]);
}

function power(id: string, base: KpLogExponentExpressionNode, exponent: KpLogExponentExpressionNode): KpLogExponentPowerNode {
  return Object.freeze({ id, semanticId: "semantic.power.two-to-x", kind: "power", base, exponent });
}

function naturalLog(
  id: string,
  semanticId: string,
  operator: KpLogExponentFunctionOperatorNode,
  argument: KpLogExponentExpressionNode,
  enclosure?: readonly [
    KpLogExponentDelimiterNode,
    KpLogExponentDelimiterNode
  ]
): KpLogExponentNaturalLogNode {
  return Object.freeze({
    id,
    semanticId,
    kind: "natural-log",
    operator,
    argument,
    ...(enclosure === undefined ? {} : { enclosure })
  });
}

function product(id: string, factors: readonly KpLogExponentExpressionNode[]): KpLogExponentProductNode {
  return Object.freeze({ id, semanticId: "semantic.product.x-log-two", kind: "product", factors: Object.freeze([...factors]) });
}

function quotient(
  id: string,
  numerator: KpLogExponentExpressionNode,
  denominator: KpLogExponentExpressionNode
): KpLogExponentQuotientNode {
  return Object.freeze({ id, semanticId: "semantic.quotient.log-seven-log-two", kind: "quotient", numerator, denominator });
}

function visit(
  node: KpLogExponentExpressionNode,
  callback: (node: KpLogExponentExpressionNode) => void
): void {
  callback(node);
  switch (node.kind) {
    case "number":
    case "symbol":
    case "function-operator":
    case "delimiter":
      return;
    case "power":
      visit(node.base, callback);
      visit(node.exponent, callback);
      return;
    case "natural-log":
      visit(node.operator, callback);
      node.enclosure?.forEach((delimiter) => visit(delimiter, callback));
      visit(node.argument, callback);
      return;
    case "product":
      node.factors.forEach((factor) => visit(factor, callback));
      return;
    case "quotient":
      visit(node.numerator, callback);
      visit(node.denominator, callback);
      return;
    case "equality":
      visit(node.left, callback);
      visit(node.right, callback);
      return;
  }
}
