import {
  kpCanonicalLogExponentDomainContract,
  type KpLogExponentAssumptionId,
  type KpLogExponentDomainContract
} from "./log-exponent-domain-assumptions.ts";
import {
  kpCanonicalLogExponentSolveStates,
  type KpLogExponentSolveState,
  type KpLogExponentSolveStateId
} from "./log-exponent-solve-states.ts";

interface KpLogExponentAuthoredOperationBase {
  readonly id: string;
  readonly sourceStateId: KpLogExponentSolveStateId;
  readonly targetStateId: KpLogExponentSolveStateId;
  readonly assumptionIds: readonly KpLogExponentAssumptionId[];
}

export interface KpApplyNaturalLogBothSidesOperation extends KpLogExponentAuthoredOperationBase {
  readonly kind: "apply-natural-log-both-sides";
  readonly function: "natural-log";
  readonly argumentSemanticIds: readonly ["semantic.power.two-to-x", "semantic.value.seven"];
}

export interface KpExtractLogPowerExponentOperation extends KpLogExponentAuthoredOperationBase {
  readonly kind: "extract-log-power-exponent";
  readonly lawId: "law.logarithm.power";
  readonly sourceLogValueSemanticId: "semantic.expression.log-two-power-x";
  readonly targetLogBaseSemanticId: "semantic.value.log-two";
  readonly powerSemanticId: "semantic.power.two-to-x";
  readonly exponentSemanticId: "semantic.unknown.x";
  readonly baseSemanticId: "semantic.base.two";
  readonly productSemanticId: "semantic.product.x-log-two";
}

export interface KpDivideByLogBaseOperation extends KpLogExponentAuthoredOperationBase {
  readonly kind: "divide-both-sides-by-log-base";
  readonly lawId: "law.equation.divide-both-sides";
  readonly divisorSemanticId: "semantic.value.log-two";
  readonly solvedSemanticId: "semantic.unknown.x";
  readonly quotientSemanticId: "semantic.quotient.log-seven-log-two";
}

export type KpLogExponentAuthoredOperation =
  | KpApplyNaturalLogBothSidesOperation
  | KpExtractLogPowerExponentOperation
  | KpDivideByLogBaseOperation;

export interface KpLogExponentAuthoredProgram {
  readonly schemaVersion: "kp.log-exponent-authored-program.v1";
  readonly id: "program.log-exponent.solve-two-power-x";
  readonly stateIds: readonly KpLogExponentSolveStateId[];
  readonly operations: readonly KpLogExponentAuthoredOperation[];
}

export function createKpCanonicalLogExponentAuthoredProgram(input: {
  readonly states?: readonly KpLogExponentSolveState[] | undefined;
  readonly domain?: KpLogExponentDomainContract | undefined;
} = {}): KpLogExponentAuthoredProgram {
  const states = input.states ?? kpCanonicalLogExponentSolveStates;
  const domain = input.domain ?? kpCanonicalLogExponentDomainContract;
  const operations = Object.freeze([
    Object.freeze({
      id: "operation.log-exponent.apply-log-both-sides",
      kind: "apply-natural-log-both-sides" as const,
      sourceStateId: "log-exponent.state.source" as const,
      targetStateId: "log-exponent.state.logged-both-sides" as const,
      assumptionIds: Object.freeze([
        "assumption.log-exponent.power-positive",
        "assumption.log-exponent.right-positive",
        "assumption.log-exponent.log-injective"
      ] as const),
      function: "natural-log" as const,
      argumentSemanticIds: Object.freeze([
        "semantic.power.two-to-x",
        "semantic.value.seven"
      ] as const)
    }),
    Object.freeze({
      id: "operation.log-exponent.extract-exponent",
      kind: "extract-log-power-exponent" as const,
      sourceStateId: "log-exponent.state.logged-both-sides" as const,
      targetStateId: "log-exponent.state.exponent-extracted" as const,
      assumptionIds: Object.freeze([
        "assumption.log-exponent.base-positive"
      ] as const),
      lawId: "law.logarithm.power" as const,
      sourceLogValueSemanticId: "semantic.expression.log-two-power-x" as const,
      targetLogBaseSemanticId: "semantic.value.log-two" as const,
      powerSemanticId: "semantic.power.two-to-x" as const,
      exponentSemanticId: "semantic.unknown.x" as const,
      baseSemanticId: "semantic.base.two" as const,
      productSemanticId: "semantic.product.x-log-two" as const
    }),
    Object.freeze({
      id: "operation.log-exponent.divide-by-log-base",
      kind: "divide-both-sides-by-log-base" as const,
      sourceStateId: "log-exponent.state.exponent-extracted" as const,
      targetStateId: "log-exponent.state.solved" as const,
      assumptionIds: Object.freeze([
        "assumption.log-exponent.log-base-nonzero"
      ] as const),
      lawId: "law.equation.divide-both-sides" as const,
      divisorSemanticId: "semantic.value.log-two" as const,
      solvedSemanticId: "semantic.unknown.x" as const,
      quotientSemanticId: "semantic.quotient.log-seven-log-two" as const
    })
  ] satisfies readonly KpLogExponentAuthoredOperation[]);

  validateProgram(states, domain, operations);
  return Object.freeze({
    schemaVersion: "kp.log-exponent-authored-program.v1" as const,
    id: "program.log-exponent.solve-two-power-x" as const,
    stateIds: Object.freeze(states.map(({ id }) => id)),
    operations
  });
}

export const kpCanonicalLogExponentAuthoredProgram =
  createKpCanonicalLogExponentAuthoredProgram();

function validateProgram(
  states: readonly KpLogExponentSolveState[],
  domain: KpLogExponentDomainContract,
  operations: readonly KpLogExponentAuthoredOperation[]
): void {
  if (operations.length !== states.length - 1) {
    throw new Error("Every adjacent log-exponent semantic state requires one authored operation.");
  }
  const assumptions = new Set(domain.assumptions.map(({ id }) => id));
  operations.forEach((operation, index) => {
    if (
      operation.sourceStateId !== states[index]?.id ||
      operation.targetStateId !== states[index + 1]?.id
    ) {
      throw new Error(`Log-exponent operation ${operation.id} breaks state adjacency.`);
    }
    const missing = operation.assumptionIds.find((id) => !assumptions.has(id));
    if (missing !== undefined) {
      throw new Error(`Log-exponent operation ${operation.id} lacks assumption ${missing}.`);
    }
  });
}
