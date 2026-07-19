import type {
  KpExactRational,
  KpLinearEquationFrame,
  KpLinearEquationTrace,
  KpLinearExpression
} from "../../domains/public-api.ts";

import { sampleLinearEquationTrace } from "./linear-equation-frame.ts";

export interface KpSymbolicEquationToken {
  readonly id: string;
  readonly semanticId: string;
  readonly kind: "term" | "operator" | "relation";
  readonly side: "left" | "relation" | "right";
  readonly latex: string;
  readonly spoken: string;
}

export interface KpSymbolicEquationIr {
  readonly schemaVersion: "kp.symbolic-equation-ir.v1";
  readonly traceId: string;
  readonly frameId: string;
  readonly equationSemanticId: string;
  readonly progressPermille: number;
  readonly tokens: readonly KpSymbolicEquationToken[];
  readonly accessibleText: string;
  readonly diagnostics: readonly string[];
}

export function projectLinearEquationTrace(
  trace: KpLinearEquationTrace,
  progressPermille: number
): KpSymbolicEquationIr {
  const sample = sampleLinearEquationTrace(trace, progressPermille);
  return projectLinearEquationFrame(trace, sample.frame, progressPermille);
}

export function projectLinearEquationFrame(
  trace: KpLinearEquationTrace,
  frame: KpLinearEquationFrame,
  progressPermille: number
): KpSymbolicEquationIr {
  if (!trace.frames.some((candidate) => candidate.id === frame.id)) {
    throw new Error(`Equation frame ${frame.id} does not belong to trace ${trace.id}.`);
  }
  const left = expressionTokens(frame, "left");
  const relation: KpSymbolicEquationToken = {
    id: `${frame.id}.relation.equals`,
    semanticId: `${frame.semanticIds.equation}.relation.equals`,
    kind: "relation",
    side: "relation",
    latex: "=",
    spoken: "equals"
  };
  const right = expressionTokens(frame, "right");
  const tokens = [...left, relation, ...right];
  return deepFreeze({
    schemaVersion: "kp.symbolic-equation-ir.v1" as const,
    traceId: trace.id,
    frameId: frame.id,
    equationSemanticId: frame.semanticIds.equation,
    progressPermille,
    tokens,
    accessibleText: tokens.map((token) => token.spoken).join(" "),
    diagnostics: trace.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`)
  });
}

function expressionTokens(
  frame: KpLinearEquationFrame,
  side: "left" | "right"
): KpSymbolicEquationToken[] {
  const expression = frame.equation[side];
  const semantic = frame.semanticIds;
  const variableSemanticId = side === "left" ? semantic.leftVariable : semantic.rightVariable;
  const constantSemanticId = side === "left" ? semantic.leftConstant : semantic.rightConstant;
  const tokens: KpSymbolicEquationToken[] = [];
  if (!isZero(expression.coefficient)) {
    tokens.push({
      id: `${frame.id}.${side}.variable`,
      semanticId: variableSemanticId,
      kind: "term",
      side,
      latex: variableLatex(expression),
      spoken: variableSpoken(expression)
    });
  }
  if (!isZero(expression.constant)) {
    const negative = expression.constant.numerator.startsWith("-");
    if (tokens.length > 0) {
      tokens.push({
        id: `${frame.id}.${side}.constant-operator`,
        semanticId: `${constantSemanticId}.operator`,
        kind: "operator",
        side,
        latex: negative ? "-" : "+",
        spoken: negative ? "minus" : "plus"
      });
    }
    tokens.push({
      id: `${frame.id}.${side}.constant`,
      semanticId: constantSemanticId,
      kind: "term",
      side,
      latex: rationalLatex(absolute(expression.constant)),
      spoken: rationalSpoken(absolute(expression.constant))
    });
  }
  if (tokens.length === 0) {
    tokens.push({
      id: `${frame.id}.${side}.zero`,
      semanticId: constantSemanticId,
      kind: "term",
      side,
      latex: "0",
      spoken: "zero"
    });
  }
  return tokens;
}

function variableLatex(expression: KpLinearExpression): string {
  const coefficient = expression.coefficient;
  if (coefficient.numerator === coefficient.denominator) return expression.variable;
  if (coefficient.numerator === `-${coefficient.denominator}`) return `-${expression.variable}`;
  return `${rationalLatex(coefficient)}${expression.variable}`;
}

function variableSpoken(expression: KpLinearExpression): string {
  const coefficient = expression.coefficient;
  if (coefficient.numerator === coefficient.denominator) return expression.variable;
  if (coefficient.numerator === `-${coefficient.denominator}`) return `negative ${expression.variable}`;
  return `${rationalSpoken(coefficient)} times ${expression.variable}`;
}

function rationalLatex(value: KpExactRational): string {
  return value.denominator === "1"
    ? value.numerator
    : `\\frac{${value.numerator}}{${value.denominator}}`;
}

function rationalSpoken(value: KpExactRational): string {
  return value.denominator === "1" ? value.numerator : `${value.numerator} over ${value.denominator}`;
}

function absolute(value: KpExactRational): KpExactRational {
  return value.numerator.startsWith("-")
    ? { numerator: value.numerator.slice(1), denominator: value.denominator }
    : value;
}

function isZero(value: KpExactRational): boolean {
  return value.numerator === "0";
}

type DeepReadonly<Value> = Value extends readonly (infer Item)[]
  ? readonly DeepReadonly<Item>[]
  : Value extends object
    ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
    : Value;

function deepFreeze<Value>(value: Value): DeepReadonly<Value> {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value as DeepReadonly<Value>;
  }
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value) as DeepReadonly<Value>;
}
