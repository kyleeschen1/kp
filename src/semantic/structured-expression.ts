export type KpStructuredExpressionNode =
  | KpStructuredNumberNode
  | KpStructuredSymbolNode
  | KpStructuredSumNode
  | KpStructuredProductNode
  | KpStructuredQuotientNode
  | KpStructuredPowerNode
  | KpStructuredNegateNode;

interface KpStructuredExpressionNodeBase {
  readonly id: string;
}

export interface KpStructuredNumberNode extends KpStructuredExpressionNodeBase {
  readonly kind: "number";
  readonly value: number;
}

export interface KpStructuredSymbolNode extends KpStructuredExpressionNodeBase {
  readonly kind: "symbol";
  readonly name: string;
}

export interface KpStructuredSumNode extends KpStructuredExpressionNodeBase {
  readonly kind: "sum";
  readonly terms: readonly KpStructuredExpressionNode[];
}

export interface KpStructuredProductNode extends KpStructuredExpressionNodeBase {
  readonly kind: "product";
  readonly factors: readonly KpStructuredExpressionNode[];
}

export interface KpStructuredQuotientNode extends KpStructuredExpressionNodeBase {
  readonly kind: "quotient";
  readonly numerator: KpStructuredExpressionNode;
  readonly denominator: KpStructuredExpressionNode;
}

export interface KpStructuredPowerNode extends KpStructuredExpressionNodeBase {
  readonly kind: "power";
  readonly base: KpStructuredExpressionNode;
  readonly exponent: KpStructuredExpressionNode;
}

export interface KpStructuredNegateNode extends KpStructuredExpressionNodeBase {
  readonly kind: "negate";
  readonly value: KpStructuredExpressionNode;
}

export interface KpStructuredExpression {
  readonly schemaVersion: "kp.structured-expression.v1";
  readonly root: KpStructuredExpressionNode;
}

export function createKpStructuredExpression(input: {
  readonly root: KpStructuredExpressionNode;
}): KpStructuredExpression {
  const ids = new Set<string>();
  const active = new WeakSet<object>();
  const root = cloneNode(input.root, ids, active);
  return Object.freeze({
    schemaVersion: "kp.structured-expression.v1" as const,
    root
  });
}

export function listKpStructuredExpressionSubtrees(
  expression: KpStructuredExpression
): readonly KpStructuredExpressionNode[] {
  return listKpExpressionNodes(expression.root, kpStructuredExpressionProtocol);
}

export function resolveKpStructuredExpressionSubtree(
  expression: KpStructuredExpression,
  id: string
): KpStructuredExpressionNode | undefined {
  requireText(id, "Structured expression subtree id");
  return listKpExpressionNodes(expression.root, kpStructuredExpressionProtocol)
    .find((node) => node.id === id);
}

export function compileKpStructuredExpressionAccessibleText(
  expression: KpStructuredExpression
): string {
  return projectKpStructuredExpressionAccessibleText(expression.root);
}

function cloneNode(
  node: KpStructuredExpressionNode,
  ids: Set<string>,
  active: WeakSet<object>
): KpStructuredExpressionNode {
  if (active.has(node)) {
    throw new Error(`Structured expression contains a cycle at subtree ${node.id}.`);
  }
  active.add(node);
  requireText(node.id, "Structured expression subtree id");
  if (ids.has(node.id)) {
    throw new Error(`Structured expression duplicates subtree id ${node.id}.`);
  }
  ids.add(node.id);
  let cloned: KpStructuredExpressionNode;
  switch (node.kind) {
    case "number":
      if (!Number.isFinite(node.value)) {
        throw new Error(`Structured number ${node.id} must be finite.`);
      }
      cloned = { id: node.id, kind: node.kind, value: node.value };
      break;
    case "symbol":
      requireText(node.name, `Structured symbol ${node.id} name`);
      cloned = { id: node.id, kind: node.kind, name: node.name };
      break;
    case "sum":
      requireArity(node.id, node.terms, "sum");
      cloned = {
        id: node.id,
        kind: node.kind,
        terms: Object.freeze(node.terms.map((term) => cloneNode(term, ids, active)))
      };
      break;
    case "product":
      requireArity(node.id, node.factors, "product");
      cloned = {
        id: node.id,
        kind: node.kind,
        factors: Object.freeze(node.factors.map((factor) => cloneNode(factor, ids, active)))
      };
      break;
    case "quotient":
      cloned = {
        id: node.id,
        kind: node.kind,
        numerator: cloneNode(node.numerator, ids, active),
        denominator: cloneNode(node.denominator, ids, active)
      };
      break;
    case "power":
      cloned = {
        id: node.id,
        kind: node.kind,
        base: cloneNode(node.base, ids, active),
        exponent: cloneNode(node.exponent, ids, active)
      };
      break;
    case "negate":
      cloned = {
        id: node.id,
        kind: node.kind,
        value: cloneNode(node.value, ids, active)
      };
      break;
  }
  active.delete(node);
  // Explicit IDs belong to semantic subtrees, so cloning and freezing cannot
  // silently replace identity with object reference or positional path.
  return Object.freeze(cloned);
}

function requireArity(
  id: string,
  children: readonly KpStructuredExpressionNode[],
  kind: "sum" | "product"
): void {
  if (children.length < 2) {
    throw new Error(`Structured ${kind} ${id} requires at least two children.`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
import {
  listKpExpressionNodes
} from "./expression-node-protocol.ts";
import {
  kpStructuredExpressionProtocol,
  projectKpStructuredExpressionAccessibleText
} from "./structured-expression-protocol.ts";
