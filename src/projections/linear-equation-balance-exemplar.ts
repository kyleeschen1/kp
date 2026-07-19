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
  readonly exactLoadAtVerifiedSolution: KpExactRational;
  readonly accessibleText: string;
}

export type KpBalanceExemplarStage = "initial" | "after-subtraction" | "solved-partition";

export type KpBalanceUnitPlacementIr =
  | { readonly kind: "pan"; readonly side: "left" | "right" }
  | { readonly kind: "removed"; readonly pathId: string }
  | { readonly kind: "partition-group"; readonly groupId: string }
  | {
    readonly kind: "shared-remainder";
    readonly groupIds: readonly [string, string];
    readonly representation: "symbolic-halves-of-one-unsplit-unit";
  };

export interface KpBalancePhysicalUnitIr {
  readonly id: string;
  readonly side: "left" | "right";
  readonly kind: "variable-unit" | "integer-unit";
  readonly ordinal: number;
  readonly semanticId: string;
  readonly latex: "x" | "1";
  readonly exactLoadAtVerifiedSolution: KpExactRational;
  readonly placement: KpBalanceUnitPlacementIr;
}

export interface KpBalancePartitionGroupIr {
  readonly id: string;
  readonly groupIndex: 0 | 1;
  readonly operationSemanticId: string;
  readonly variableUnitId: string;
  readonly wholeRightUnitIds: readonly [string, string];
  readonly sharedRemainder: {
    readonly unitId: string;
    readonly exactShare: KpExactRational;
    readonly representation: "symbolic-share-of-unsplit-unit";
  };
  readonly exactRightValue: KpExactRational;
  readonly selectedAsRepresentative: boolean;
}

export interface KpBalanceOperationPathIr {
  readonly id: string;
  readonly operationSemanticId: string;
  readonly kind: "matched-removal" | "partition-assignment" | "shared-remainder";
  readonly sourceUnitIds: readonly string[];
  readonly destinationIds: readonly string[];
  readonly pairIndex?: number;
  readonly groupIndex?: 0 | 1;
}

export interface KpBalanceSymbolicCorrespondenceIr {
  readonly id: string;
  readonly geometricId: string;
  readonly symbolicSemanticId: string;
  readonly relation: "term-instance" | "operation-path" | "partition-equivalence";
}

export interface KpBalanceEqualityIr {
  readonly left: KpExactRational;
  readonly right: KpExactRational;
  readonly isEqual: true;
}

export interface KpBalanceOperationApplicationIr {
  readonly id: string;
  readonly operationSemanticId: string;
  readonly side: "left" | "right";
  readonly kind: KpLinearEquationOperation["kind"];
  readonly spoken: string;
}

export interface KpBalanceSceneIr {
  readonly schemaVersion: "kp.balance-exemplar-ir.v2";
  readonly exemplarKind: "canonical-two-x-plus-three";
  readonly stage: KpBalanceExemplarStage;
  readonly traceId: string;
  readonly frameId: string;
  readonly equationSemanticId: string;
  readonly diagramSemanticId: string;
  readonly progressPermille: number;
  readonly sides: readonly [KpBalanceSideIr, KpBalanceSideIr];
  readonly physicalUnits: readonly KpBalancePhysicalUnitIr[];
  readonly partitionGroups: readonly KpBalancePartitionGroupIr[];
  readonly operationPaths: readonly KpBalanceOperationPathIr[];
  readonly symbolicCorrespondences: readonly KpBalanceSymbolicCorrespondenceIr[];
  readonly equality: KpBalanceEqualityIr;
  readonly operationApplications: readonly KpBalanceOperationApplicationIr[];
  readonly accessibleText: string;
  readonly diagnostics: readonly string[];
}

export function projectLinearEquationBalanceExemplar(
  trace: KpLinearEquationTrace,
  progressPermille: number,
  options: { readonly diagramSemanticId: string }
): KpBalanceSceneIr {
  requireCanonicalExemplarTrace(trace);
  const sample = sampleLinearEquationTrace(trace, progressPermille);
  const stage = stageFor(sample.frameIndex);
  const left = projectSide(sample.frame, "left", trace.solution);
  const right = projectSide(sample.frame, "right", trace.solution);
  const operationPaths = projectOperationPaths(trace, stage);
  const partitionGroups = stage === "solved-partition" ? projectPartitionGroups(trace) : [];
  const physicalUnits = projectPhysicalUnits(trace, stage);
  const operationApplications = sample.enteringOperation === undefined
    ? []
    : projectTwoSidedOperation(sample.enteringOperation);
  const operationText = operationApplications[0]?.spoken;
  return deepFreeze({
    schemaVersion: "kp.balance-exemplar-ir.v2" as const,
    exemplarKind: "canonical-two-x-plus-three" as const,
    stage,
    traceId: trace.id,
    frameId: sample.frame.id,
    equationSemanticId: sample.frame.semanticIds.equation,
    diagramSemanticId: options.diagramSemanticId,
    progressPermille,
    sides: [left, right] as const,
    physicalUnits,
    partitionGroups,
    operationPaths,
    symbolicCorrespondences: projectSymbolicCorrespondences(
      trace,
      physicalUnits,
      partitionGroups,
      operationPaths
    ),
    equality: exactEquality(left.exactLoadAtVerifiedSolution, right.exactLoadAtVerifiedSolution),
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
  side: "left" | "right",
  solution: KpExactRational
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
    exactLoadAtVerifiedSolution: evaluateExpression(expression, solution),
    accessibleText: expressionSpoken(expression)
  };
}

function stageFor(frameIndex: number): KpBalanceExemplarStage {
  if (frameIndex === 0) return "initial";
  if (frameIndex === 1) return "after-subtraction";
  return "solved-partition";
}

function projectPhysicalUnits(
  trace: KpLinearEquationTrace,
  stage: KpBalanceExemplarStage
): readonly KpBalancePhysicalUnitIr[] {
  const initial = trace.frames[0]!;
  const groupIds = [partitionGroupId(0), partitionGroupId(1)] as const;
  const variableUnits = [0, 1].map((ordinal): KpBalancePhysicalUnitIr => ({
    id: variableUnitId(ordinal),
    side: "left",
    kind: "variable-unit",
    ordinal,
    semanticId: initial.semanticIds.leftVariable,
    latex: "x",
    exactLoadAtVerifiedSolution: trace.solution,
    placement: stage === "solved-partition"
      ? { kind: "partition-group", groupId: groupIds[ordinal]! }
      : { kind: "pan", side: "left" }
  }));
  const leftUnits = [0, 1, 2].map((ordinal): KpBalancePhysicalUnitIr => ({
    id: integerUnitId("left", ordinal),
    side: "left",
    kind: "integer-unit",
    ordinal,
    semanticId: initial.semanticIds.leftConstant,
    latex: "1",
    exactLoadAtVerifiedSolution: one(),
    placement: stage === "initial"
      ? { kind: "pan", side: "left" }
      : { kind: "removed", pathId: removalPathId(ordinal) }
  }));
  const rightUnits = Array.from({ length: 8 }, (_, ordinal): KpBalancePhysicalUnitIr => {
    const removedPairIndex = ordinal - 5;
    const placement: KpBalanceUnitPlacementIr = stage !== "initial" && removedPairIndex >= 0
      ? { kind: "removed", pathId: removalPathId(removedPairIndex) }
      : stage !== "solved-partition"
        ? { kind: "pan", side: "right" }
        : ordinal === 4
          ? {
            kind: "shared-remainder",
            groupIds,
            representation: "symbolic-halves-of-one-unsplit-unit"
          }
          : { kind: "partition-group", groupId: groupIds[ordinal < 2 ? 0 : 1] };
    return {
      id: integerUnitId("right", ordinal),
      side: "right",
      kind: "integer-unit",
      ordinal,
      semanticId: initial.semanticIds.rightConstant,
      latex: "1",
      exactLoadAtVerifiedSolution: one(),
      placement
    };
  });
  return [...variableUnits, ...leftUnits, ...rightUnits];
}

function projectPartitionGroups(trace: KpLinearEquationTrace): readonly KpBalancePartitionGroupIr[] {
  const division = trace.operations[1]!;
  return ([0, 1] as const).map((groupIndex) => ({
    id: partitionGroupId(groupIndex),
    groupIndex,
    operationSemanticId: division.semanticId,
    variableUnitId: variableUnitId(groupIndex),
    wholeRightUnitIds: groupIndex === 0
      ? [integerUnitId("right", 0), integerUnitId("right", 1)]
      : [integerUnitId("right", 2), integerUnitId("right", 3)],
    sharedRemainder: {
      unitId: integerUnitId("right", 4),
      exactShare: half(),
      // The diagram may label the exact share, but it may not depict the integer weight as physically cut.
      representation: "symbolic-share-of-unsplit-unit" as const
    },
    exactRightValue: trace.solution,
    selectedAsRepresentative: groupIndex === 0
  }));
}

function projectOperationPaths(
  trace: KpLinearEquationTrace,
  stage: KpBalanceExemplarStage
): readonly KpBalanceOperationPathIr[] {
  if (stage === "initial") return [];
  const subtraction = trace.operations[0]!;
  const removals = [0, 1, 2].map((pairIndex): KpBalanceOperationPathIr => ({
    id: removalPathId(pairIndex),
    operationSemanticId: subtraction.semanticId,
    kind: "matched-removal",
    sourceUnitIds: [integerUnitId("left", pairIndex), integerUnitId("right", pairIndex + 5)],
    destinationIds: [`balance.removed-pair.${pairIndex}`],
    pairIndex
  }));
  if (stage === "after-subtraction") return removals;
  const division = trace.operations[1]!;
  const assignments: KpBalanceOperationPathIr[] = [0, 1].flatMap((groupIndex) => {
    const typedGroupIndex = groupIndex as 0 | 1;
    const wholeOrdinals = typedGroupIndex === 0 ? [0, 1] : [2, 3];
    return [variableUnitId(groupIndex), ...wholeOrdinals.map((ordinal) => integerUnitId("right", ordinal))]
      .map((unitId) => ({
        id: `balance.path.partition.${groupIndex}.${unitId}`,
        operationSemanticId: division.semanticId,
        kind: "partition-assignment" as const,
        sourceUnitIds: [unitId],
        destinationIds: [partitionGroupId(typedGroupIndex)],
        groupIndex: typedGroupIndex
      }));
  });
  return [...removals, ...assignments, {
    id: "balance.path.partition.shared-remainder",
    operationSemanticId: division.semanticId,
    kind: "shared-remainder",
    sourceUnitIds: [integerUnitId("right", 4)],
    destinationIds: [partitionGroupId(0), partitionGroupId(1)]
  }];
}

function projectSymbolicCorrespondences(
  trace: KpLinearEquationTrace,
  physicalUnits: readonly KpBalancePhysicalUnitIr[],
  groups: readonly KpBalancePartitionGroupIr[],
  paths: readonly KpBalanceOperationPathIr[]
): readonly KpBalanceSymbolicCorrespondenceIr[] {
  const solved = trace.frames[2]!;
  return [
    ...physicalUnits.map((unit): KpBalanceSymbolicCorrespondenceIr => ({
      id: `balance.correspondence.${unit.id}`,
      geometricId: unit.id,
      symbolicSemanticId: unit.semanticId,
      relation: "term-instance"
    })),
    ...paths.map((path): KpBalanceSymbolicCorrespondenceIr => ({
      id: `balance.correspondence.${path.id}`,
      geometricId: path.id,
      symbolicSemanticId: path.operationSemanticId,
      relation: "operation-path"
    })),
    ...groups.flatMap((group): readonly KpBalanceSymbolicCorrespondenceIr[] => ([
      {
        id: `balance.correspondence.${group.id}.variable`,
        geometricId: group.id,
        symbolicSemanticId: solved.semanticIds.leftVariable,
        relation: "partition-equivalence"
      },
      {
        id: `balance.correspondence.${group.id}.quotient`,
        geometricId: group.id,
        symbolicSemanticId: solved.semanticIds.rightConstant,
        relation: "partition-equivalence"
      }
    ]))
  ];
}

function exactEquality(left: KpExactRational, right: KpExactRational): KpBalanceEqualityIr {
  if (!sameRational(left, right)) {
    throw new Error(`Canonical balance projection produced unequal loads ${rationalLatex(left)} and ${rationalLatex(right)}.`);
  }
  return { left, right, isEqual: true };
}

function evaluateExpression(expression: KpLinearExpression, solution: KpExactRational): KpExactRational {
  return addRationals(multiplyRationals(expression.coefficient, solution), expression.constant);
}

function requireCanonicalExemplarTrace(trace: KpLinearEquationTrace): void {
  const frames = trace.frames;
  const canonical = trace.provenance.providerId === "linear-problems.exact-rational" &&
    trace.provenance.protocolVersion === "linear-problem.v1" &&
    trace.solutionVerified && trace.preservation === "strict" &&
    trace.variable === "x" && sameRational(trace.solution, rational(5, 2)) &&
    frames.length === 3 && trace.operations.length === 2 &&
    expressionMatches(frames[0]?.equation.left, 2, 3) && expressionMatches(frames[0]?.equation.right, 0, 8) &&
    expressionMatches(frames[1]?.equation.left, 2, 0) && expressionMatches(frames[1]?.equation.right, 0, 5) &&
    expressionMatches(frames[2]?.equation.left, 1, 0) &&
    frames[2] !== undefined && sameRational(frames[2].equation.right.coefficient, zero()) &&
    sameRational(frames[2].equation.right.constant, rational(5, 2)) &&
    trace.operations[0]?.kind === "subtract-both-sides" &&
    trace.operations[1]?.kind === "divide-both-sides";
  if (!canonical) {
    throw new Error(
      "The balance exemplar IR supports only the canonical 2x + 3 = 8 trace; it is not a universal physical-weight model."
    );
  }
}

function expressionMatches(
  expression: KpLinearExpression | undefined,
  coefficient: number,
  constant: number
): boolean {
  return expression !== undefined && sameRational(expression.coefficient, rational(coefficient)) &&
    sameRational(expression.constant, rational(constant));
}

function variableUnitId(ordinal: number): string {
  return `balance.left.variable.${ordinal}`;
}

function integerUnitId(side: "left" | "right", ordinal: number): string {
  return `balance.${side}.unit.${ordinal}`;
}

function removalPathId(pairIndex: number): string {
  return `balance.path.remove.${pairIndex}`;
}

function partitionGroupId(groupIndex: 0 | 1): string {
  return `balance.partition.${groupIndex}`;
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

function one(): KpExactRational {
  return { numerator: "1", denominator: "1" };
}

function half(): KpExactRational {
  return { numerator: "1", denominator: "2" };
}

function rational(numerator: number, denominator = 1): KpExactRational {
  return normalizeRational(BigInt(numerator), BigInt(denominator));
}

function addRationals(left: KpExactRational, right: KpExactRational): KpExactRational {
  const leftNumerator = BigInt(left.numerator);
  const leftDenominator = BigInt(left.denominator);
  const rightNumerator = BigInt(right.numerator);
  const rightDenominator = BigInt(right.denominator);
  return normalizeRational(
    leftNumerator * rightDenominator + rightNumerator * leftDenominator,
    leftDenominator * rightDenominator
  );
}

function multiplyRationals(left: KpExactRational, right: KpExactRational): KpExactRational {
  return normalizeRational(
    BigInt(left.numerator) * BigInt(right.numerator),
    BigInt(left.denominator) * BigInt(right.denominator)
  );
}

function sameRational(left: KpExactRational, right: KpExactRational): boolean {
  return BigInt(left.numerator) * BigInt(right.denominator) ===
    BigInt(right.numerator) * BigInt(left.denominator);
}

function normalizeRational(numerator: bigint, denominator: bigint): KpExactRational {
  if (denominator === 0n) throw new RangeError("Balance exemplar rational denominator cannot be zero.");
  const sign = denominator < 0n ? -1n : 1n;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: String(numerator * sign / divisor),
    denominator: String(denominator * sign / divisor)
  };
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) [a, b] = [b, a % b];
  return a === 0n ? 1n : a;
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
