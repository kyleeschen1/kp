import type {
  KpExactRational,
  KpLinearEquationFrame,
  KpLinearEquationOperation,
  KpLinearEquationTrace,
  KpLinearExpression
} from "../../domains/public-api.ts";

import { sampleLinearEquationTrace } from "./linear-equation-frame.ts";

export interface KpBalanceTermIr {
  readonly id: string;
  readonly semanticId: string;
  readonly side: "left" | "right";
  readonly kind: "variable" | "constant";
  readonly value: KpExactRational;
  readonly variable?: string;
  readonly latex: string;
  readonly spoken: string;
}

export interface KpBalanceSideIr {
  readonly id: string;
  readonly side: "left" | "right";
  readonly terms: readonly KpBalanceTermIr[];
  readonly accessibleText: string;
}

export interface KpBalanceOperationApplicationIr {
  readonly id: string;
  readonly operationSemanticId: string;
  readonly side: "left" | "right";
  readonly kind: KpLinearEquationOperation["kind"];
  readonly spoken: string;
}

export interface KpBalanceSceneIr {
  readonly schemaVersion: "kp.balance-exemplar-ir.v1";
  readonly traceId: string;
  readonly frameId: string;
  readonly equationSemanticId: string;
  readonly diagramSemanticId: string;
  readonly progressPermille: number;
  readonly sides: readonly [KpBalanceSideIr, KpBalanceSideIr];
  readonly operationApplications: readonly KpBalanceOperationApplicationIr[];
  readonly accessibleText: string;
  readonly diagnostics: readonly string[];
}

export function projectLinearEquationBalanceExemplar(
  trace: KpLinearEquationTrace,
  progressPermille: number,
  options: { readonly diagramSemanticId: string }
): KpBalanceSceneIr {
  const sample = sampleLinearEquationTrace(trace, progressPermille);
  const left = projectSide(sample.frame, "left");
  const right = projectSide(sample.frame, "right");
  const operationApplications = sample.enteringOperation === undefined
    ? []
    : projectTwoSidedOperation(sample.enteringOperation);
  const operationText = operationApplications[0]?.spoken;
  return deepFreeze({
    schemaVersion: "kp.balance-exemplar-ir.v1" as const,
    traceId: trace.id,
    frameId: sample.frame.id,
    equationSemanticId: sample.frame.semanticIds.equation,
    diagramSemanticId: options.diagramSemanticId,
    progressPermille,
    sides: [left, right] as const,
    operationApplications,
    accessibleText: [
      `Balanced equation: ${left.accessibleText} equals ${right.accessibleText}.`,
      operationText === undefined ? undefined : `${operationText} on both sides.`
    ].filter((value): value is string => value !== undefined).join(" "),
    diagnostics: trace.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
  });
}

function projectSide(
  frame: KpLinearEquationFrame,
  side: "left" | "right"
): KpBalanceSideIr {
  const expression = frame.equation[side];
  const variableSemanticId = side === "left"
    ? frame.semanticIds.leftVariable
    : frame.semanticIds.rightVariable;
  const constantSemanticId = side === "left"
    ? frame.semanticIds.leftConstant
    : frame.semanticIds.rightConstant;
  const terms: KpBalanceTermIr[] = [];
  if (!isZero(expression.coefficient)) {
    terms.push(term(
      frame,
      side,
      "variable",
      variableSemanticId,
      expression.coefficient,
      expression.variable
    ));
  }
  if (!isZero(expression.constant)) {
    terms.push(term(frame, side, "constant", constantSemanticId, expression.constant));
  }
  if (terms.length === 0) {
    terms.push(term(frame, side, "constant", constantSemanticId, zero()));
  }
  return {
    id: `${frame.id}.balance.${side}`,
    side,
    terms,
    accessibleText: expressionSpoken(expression)
  };
}

function term(
  frame: KpLinearEquationFrame,
  side: "left" | "right",
  kind: "variable" | "constant",
  semanticId: string,
  value: KpExactRational,
  variable?: string
): KpBalanceTermIr {
  return {
    id: `${frame.id}.balance.${side}.${kind}`,
    semanticId,
    side,
    kind,
    value,
    ...(variable === undefined ? {} : { variable }),
    latex: variable === undefined ? rationalLatex(value) : variableLatex(value, variable),
    spoken: variable === undefined ? rationalSpoken(value) : variableSpoken(value, variable)
  };
}

function projectTwoSidedOperation(
  operation: KpLinearEquationOperation
): readonly [KpBalanceOperationApplicationIr, KpBalanceOperationApplicationIr] {
  const spoken = operationSpoken(operation.kind);
  const application = (side: "left" | "right"): KpBalanceOperationApplicationIr => ({
    id: `${operation.id}.${side}`,
    operationSemanticId: operation.semanticId,
    side,
    kind: operation.kind,
    spoken
  });
  return [application("left"), application("right")];
}

function operationSpoken(kind: KpLinearEquationOperation["kind"]): string {
  switch (kind) {
    case "add-both-sides": return "addition";
    case "subtract-both-sides": return "subtraction";
    case "multiply-both-sides": return "multiplication";
    case "divide-both-sides": return "division";
    case "simplify": return "simplification";
    case "equivalent-rewrite": return "equivalent rewrite";
    case "external": return "external operation";
  }
}

function expressionSpoken(expression: KpLinearExpression): string {
  const pieces: string[] = [];
  if (!isZero(expression.coefficient)) pieces.push(variableSpoken(expression.coefficient, expression.variable));
  if (!isZero(expression.constant)) {
    const negative = expression.constant.numerator.startsWith("-");
    const magnitude = negative
      ? { ...expression.constant, numerator: expression.constant.numerator.slice(1) }
      : expression.constant;
    const spoken = rationalSpoken(magnitude);
    pieces.push(pieces.length === 0 ? rationalSpoken(expression.constant) : `${negative ? "minus" : "plus"} ${spoken}`);
  }
  return pieces.join(" ") || "zero";
}

function variableLatex(value: KpExactRational, variable: string): string {
  if (value.numerator === value.denominator) return variable;
  if (value.numerator === `-${value.denominator}`) return `-${variable}`;
  return `${rationalLatex(value)}${variable}`;
}

function variableSpoken(value: KpExactRational, variable: string): string {
  if (value.numerator === value.denominator) return variable;
  if (value.numerator === `-${value.denominator}`) return `negative ${variable}`;
  return `${rationalSpoken(value)} times ${variable}`;
}

function rationalLatex(value: KpExactRational): string {
  return value.denominator === "1"
    ? value.numerator
    : `\\frac{${value.numerator}}{${value.denominator}}`;
}

function rationalSpoken(value: KpExactRational): string {
  if (value.denominator === "1") {
    return value.numerator.startsWith("-")
      ? `negative ${value.numerator.slice(1)}`
      : value.numerator;
  }
  const numerator = value.numerator.startsWith("-")
    ? `negative ${value.numerator.slice(1)}`
    : value.numerator;
  return `${numerator} over ${value.denominator}`;
}

function zero(): KpExactRational {
  return { numerator: "0", denominator: "1" };
}

function isZero(value: KpExactRational): boolean {
  return value.numerator === "0";
}

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
