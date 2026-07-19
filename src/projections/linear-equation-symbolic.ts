import type {
  KpExactRational,
  KpLinearEquationFrame,
  KpLinearEquationOperation,
  KpLinearEquationTrace,
  KpLinearExpression
} from "../../domains/public-api.ts";

import { sampleLinearEquationTrace } from "./linear-equation-frame.ts";

export interface KpSymbolicEquationToken {
  readonly id: string;
  readonly continuantId: string;
  readonly semanticId: string;
  readonly kind: "term" | "operator" | "relation";
  readonly side: "left" | "relation" | "right";
  readonly latex: string;
  readonly spoken: string;
}

export interface KpSymbolicEquationLayoutIr {
  readonly frameId: string;
  readonly equationSemanticId: string;
  readonly tokens: readonly KpSymbolicEquationToken[];
  readonly accessibleText: string;
}

export interface KpSymbolicTokenLineageIr {
  readonly continuantId: string;
  readonly semanticId: string;
  readonly continuity: "persistent" | "transformed" | "introduced" | "retired";
  readonly sourceTokenId?: string;
  readonly targetTokenId?: string;
}

export interface KpSymbolicOperationApplicationIr {
  readonly id: string;
  readonly operationId: string;
  readonly operationSemanticId: string;
  readonly side: "left" | "right";
  readonly kind: KpLinearEquationOperation["kind"];
  readonly sourceOperation: string;
  readonly classification: KpLinearEquationOperation["classification"];
  readonly operatorLatex?: string;
  readonly operatorSpoken?: string;
  readonly operand?: KpExactRational;
  readonly operatorTokenId?: string;
  readonly operandTokenId?: string;
}

export type KpSymbolicTransitionPhase =
  | "source"
  | "introduce-operation"
  | "transform"
  | "settle"
  | "target";

export interface KpSymbolicEquationTransitionIr {
  readonly operationId: string;
  readonly operationSemanticId: string;
  readonly fromFrameId: string;
  readonly toFrameId: string;
  readonly progressPermille: number;
  readonly phase: KpSymbolicTransitionPhase;
  readonly phaseProgressPermille: number;
  readonly sourceLayout: KpSymbolicEquationLayoutIr;
  readonly targetLayout: KpSymbolicEquationLayoutIr;
  readonly expandedLayout?: KpSymbolicEquationLayoutIr;
  readonly lineage: readonly KpSymbolicTokenLineageIr[];
  readonly operationApplications: readonly [
    KpSymbolicOperationApplicationIr,
    KpSymbolicOperationApplicationIr
  ];
}

export interface KpSymbolicOperationWindow {
  readonly operationId: string;
  readonly startPermille: number;
  readonly endPermille: number;
}

export interface KpSymbolicEquationProjectionOptions {
  readonly operationWindows?: readonly KpSymbolicOperationWindow[];
}

export interface KpSymbolicEquationIr {
  readonly schemaVersion: "kp.symbolic-equation-ir.v1";
  readonly traceId: string;
  readonly frameId: string;
  readonly equationSemanticId: string;
  readonly progressPermille: number;
  readonly tokens: readonly KpSymbolicEquationToken[];
  readonly nativeLayout: KpSymbolicEquationLayoutIr;
  readonly transition?: KpSymbolicEquationTransitionIr;
  readonly accessibleText: string;
  readonly diagnostics: readonly string[];
}

export function projectLinearEquationTrace(
  trace: KpLinearEquationTrace,
  progressPermille: number,
  options: KpSymbolicEquationProjectionOptions = {}
): KpSymbolicEquationIr {
  const sample = sampleLinearEquationTrace(trace, progressPermille);
  const native = projectLinearEquationFrame(trace, sample.frame, progressPermille);
  const transition = projectTransition(trace, progressPermille, options.operationWindows);
  return deepFreeze({
    ...native,
    ...(transition === undefined ? {} : { transition })
  });
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
    continuantId: "relation.equals",
    semanticId: `${frame.semanticIds.equation}.relation.equals`,
    kind: "relation",
    side: "relation",
    latex: "=",
    spoken: "equals"
  };
  const right = expressionTokens(frame, "right");
  const tokens = [...left, relation, ...right];
  const nativeLayout = equationLayout(frame, tokens);
  return deepFreeze({
    schemaVersion: "kp.symbolic-equation-ir.v1" as const,
    traceId: trace.id,
    frameId: frame.id,
    equationSemanticId: frame.semanticIds.equation,
    progressPermille,
    tokens,
    nativeLayout,
    accessibleText: nativeLayout.accessibleText,
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
      continuantId: variableSemanticId,
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
        continuantId: `${constantSemanticId}.operator`,
        semanticId: `${constantSemanticId}.operator`,
        kind: "operator",
        side,
        latex: negative ? "-" : "+",
        spoken: negative ? "minus" : "plus"
      });
    }
    tokens.push({
      id: `${frame.id}.${side}.constant`,
      continuantId: constantSemanticId,
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
      continuantId: constantSemanticId,
      semanticId: constantSemanticId,
      kind: "term",
      side,
      latex: "0",
      spoken: "zero"
    });
  }
  return tokens;
}

function projectTransition(
  trace: KpLinearEquationTrace,
  progressPermille: number,
  requestedWindows: readonly KpSymbolicOperationWindow[] | undefined
): KpSymbolicEquationTransitionIr | undefined {
  if (trace.operations.length === 0) return undefined;
  const windows = requestedWindows ?? equalOperationWindows(trace.operations);
  requireOperationWindows(trace.operations, windows);
  const operationIndex = Math.max(0, windows.findIndex((window) => progressPermille <= window.endPermille));
  const operation = trace.operations[operationIndex]!;
  const window = windows[operationIndex]!;
  const fromFrame = requireFrame(trace, operation.fromFrameId);
  const toFrame = requireFrame(trace, operation.toFrameId);
  const transitionProgress = Math.max(0, Math.min(1000,
    Math.round((progressPermille - window.startPermille) * 1000 /
      Math.max(1, window.endPermille - window.startPermille))
  ));
  const sourceLayout = layoutForFrame(fromFrame);
  const targetLayout = layoutForFrame(toFrame);
  const operationApplications = operationApplicationIr(operation, fromFrame, toFrame);
  const expandedLayout = expandedOperationLayout(fromFrame, sourceLayout, operationApplications);
  const phase = transitionPhase(transitionProgress);
  return {
    operationId: operation.id,
    operationSemanticId: operation.semanticId,
    fromFrameId: fromFrame.id,
    toFrameId: toFrame.id,
    progressPermille: transitionProgress,
    phase: phase.name,
    phaseProgressPermille: phase.progressPermille,
    sourceLayout,
    targetLayout,
    ...(expandedLayout === undefined ? {} : { expandedLayout }),
    lineage: tokenLineage(sourceLayout.tokens, targetLayout.tokens),
    operationApplications
  };
}

function operationApplicationIr(
  operation: KpLinearEquationOperation,
  fromFrame: KpLinearEquationFrame,
  toFrame: KpLinearEquationFrame
): readonly [KpSymbolicOperationApplicationIr, KpSymbolicOperationApplicationIr] {
  const operand = translationOperand(operation, fromFrame, toFrame);
  return ["left", "right"].map((side) => {
    const id = `${operation.id}.${side}`;
    return {
      id,
      operationId: operation.id,
      operationSemanticId: operation.semanticId,
      side,
      kind: operation.kind,
      sourceOperation: operation.sourceOperation,
      classification: operation.classification,
      ...(operand === undefined ? {} : {
        operatorLatex: operation.kind === "subtract-both-sides" ? "-" : "+",
        operatorSpoken: operation.kind === "subtract-both-sides" ? "minus" : "plus",
        operand,
        operatorTokenId: `${id}.operator`,
        operandTokenId: `${id}.operand`
      })
    };
  }) as [KpSymbolicOperationApplicationIr, KpSymbolicOperationApplicationIr];
}

function translationOperand(
  operation: KpLinearEquationOperation,
  fromFrame: KpLinearEquationFrame,
  toFrame: KpLinearEquationFrame
): KpExactRational | undefined {
  if (operation.kind !== "subtract-both-sides" && operation.kind !== "add-both-sides") return undefined;
  const change = subtractRational(toFrame.equation.left.constant, fromFrame.equation.left.constant);
  return absolute(change);
}

function expandedOperationLayout(
  frame: KpLinearEquationFrame,
  source: KpSymbolicEquationLayoutIr,
  applications: readonly [KpSymbolicOperationApplicationIr, KpSymbolicOperationApplicationIr]
): KpSymbolicEquationLayoutIr | undefined {
  if (applications.some((application) => application.operand === undefined)) return undefined;
  const relationIndex = source.tokens.findIndex((token) => token.side === "relation");
  const left = source.tokens.slice(0, relationIndex);
  const relation = source.tokens[relationIndex]!;
  const right = source.tokens.slice(relationIndex + 1);
  const applicationTokens = (application: KpSymbolicOperationApplicationIr): KpSymbolicEquationToken[] => [{
    id: application.operatorTokenId!,
    continuantId: `${application.operationSemanticId}.${application.side}.operator`,
    semanticId: application.operationSemanticId,
    kind: "operator",
    side: application.side,
    latex: application.operatorLatex!,
    spoken: application.operatorSpoken!
  }, {
    id: application.operandTokenId!,
    continuantId: `${application.operationSemanticId}.${application.side}.operand`,
    semanticId: application.operationSemanticId,
    kind: "term",
    side: application.side,
    latex: rationalLatex(application.operand!),
    spoken: rationalSpoken(application.operand!)
  }];
  return equationLayout(frame, [
    ...left,
    ...applicationTokens(applications[0]),
    relation,
    ...right,
    ...applicationTokens(applications[1])
  ]);
}

function equalOperationWindows(
  operations: readonly KpLinearEquationOperation[]
): readonly KpSymbolicOperationWindow[] {
  return operations.map((operation, index) => ({
    operationId: operation.id,
    startPermille: Math.round(index * 1000 / operations.length),
    endPermille: Math.round((index + 1) * 1000 / operations.length)
  }));
}

function requireOperationWindows(
  operations: readonly KpLinearEquationOperation[],
  windows: readonly KpSymbolicOperationWindow[]
): void {
  if (windows.length !== operations.length || windows.some((window, index) =>
    window.operationId !== operations[index]?.id ||
    !Number.isInteger(window.startPermille) || !Number.isInteger(window.endPermille) ||
    window.startPermille < 0 || window.endPermille > 1000 ||
    window.startPermille >= window.endPermille ||
    (index > 0 && window.startPermille !== windows[index - 1]?.endPermille)
  )) {
    throw new TypeError("Symbolic operation windows must follow trace operation order without gaps.");
  }
}

function layoutForFrame(frame: KpLinearEquationFrame): KpSymbolicEquationLayoutIr {
  const left = expressionTokens(frame, "left");
  const relation: KpSymbolicEquationToken = {
    id: `${frame.id}.relation.equals`,
    continuantId: "relation.equals",
    semanticId: `${frame.semanticIds.equation}.relation.equals`,
    kind: "relation",
    side: "relation",
    latex: "=",
    spoken: "equals"
  };
  return equationLayout(frame, [...left, relation, ...expressionTokens(frame, "right")]);
}

function equationLayout(
  frame: KpLinearEquationFrame,
  tokens: readonly KpSymbolicEquationToken[]
): KpSymbolicEquationLayoutIr {
  return {
    frameId: frame.id,
    equationSemanticId: frame.semanticIds.equation,
    tokens,
    accessibleText: tokens.map((token) => token.spoken).join(" ")
  };
}

function tokenLineage(
  source: readonly KpSymbolicEquationToken[],
  target: readonly KpSymbolicEquationToken[]
): KpSymbolicTokenLineageIr[] {
  // A semantic slot can survive an operation while its displayed value changes; motion must not imply material identity.
  const sourceById = new Map(source.map((token) => [token.continuantId, token]));
  const targetById = new Map(target.map((token) => [token.continuantId, token]));
  return [...new Set([...sourceById.keys(), ...targetById.keys()])].map((continuantId) => {
    const sourceToken = sourceById.get(continuantId);
    const targetToken = targetById.get(continuantId);
    return {
      continuantId,
      semanticId: targetToken?.semanticId ?? sourceToken!.semanticId,
      continuity: sourceToken !== undefined && targetToken !== undefined
        ? sourceToken.latex === targetToken.latex ? "persistent" as const : "transformed" as const
        : sourceToken === undefined ? "introduced" as const : "retired" as const,
      ...(sourceToken === undefined ? {} : { sourceTokenId: sourceToken.id }),
      ...(targetToken === undefined ? {} : { targetTokenId: targetToken.id })
    };
  });
}

function transitionPhase(progressPermille: number): {
  readonly name: KpSymbolicTransitionPhase;
  readonly progressPermille: number;
} {
  if (progressPermille === 0) return { name: "source", progressPermille: 0 };
  if (progressPermille === 1000) return { name: "target", progressPermille: 1000 };
  if (progressPermille <= 200) return {
    name: "introduce-operation",
    progressPermille: Math.round(progressPermille * 1000 / 200)
  };
  if (progressPermille <= 780) return {
    name: "transform",
    progressPermille: Math.round((progressPermille - 200) * 1000 / 580)
  };
  return {
    name: "settle",
    progressPermille: Math.round((progressPermille - 780) * 1000 / 220)
  };
}

function requireFrame(trace: KpLinearEquationTrace, frameId: string): KpLinearEquationFrame {
  const frame = trace.frames.find((candidate) => candidate.id === frameId);
  if (frame === undefined) throw new Error(`Operation references missing equation frame ${frameId}.`);
  return frame;
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

function subtractRational(left: KpExactRational, right: KpExactRational): KpExactRational {
  const numerator = BigInt(left.numerator) * BigInt(right.denominator) -
    BigInt(right.numerator) * BigInt(left.denominator);
  const denominator = BigInt(left.denominator) * BigInt(right.denominator);
  const divisor = greatestCommonDivisor(numerator, denominator);
  const sign = denominator / divisor < 0n ? -1n : 1n;
  return {
    numerator: String(numerator / divisor * sign),
    denominator: String(denominator / divisor * sign)
  };
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
}

type DeepReadonly<Value> = Value extends readonly unknown[]
  ? { readonly [Index in keyof Value]: DeepReadonly<Value[Index]> }
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
