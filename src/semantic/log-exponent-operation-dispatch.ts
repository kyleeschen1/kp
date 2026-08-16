import {
  createKpClosedDispatchRegistry,
  requireKpClosedDispatchEntry
} from "../domain-ir/equation-extension-registry.ts";
import type {
  KpApplyNaturalLogBothSidesOperation,
  KpDivideByLogBaseOperation,
  KpExtractLogPowerExponentOperation,
  KpLogExponentAuthoredOperation
} from "./log-exponent-authored-operations.ts";
import type { KpLogExponentSolveState } from "./log-exponent-solve-states.ts";
import {
  compileKpApplyNaturalLogBothSides,
  compileKpDivideByLogBase,
  compileKpExtractLogPowerExponent,
  type KpCompiledLogExponentOperation
} from "./log-exponent-transformation-compiler.ts";

export type KpLogExponentOperationKind =
  KpLogExponentAuthoredOperation["kind"];

interface KpLogExponentCompilationInput {
  readonly operation: KpLogExponentAuthoredOperation;
  readonly source: KpLogExponentSolveState;
  readonly target: KpLogExponentSolveState;
}

interface KpLogExponentOperationDispatchEntry {
  readonly id: KpLogExponentOperationKind;
  readonly compile: (
    input: KpLogExponentCompilationInput
  ) => KpCompiledLogExponentOperation;
}

export const kpLogExponentOperationDispatch =
  createKpClosedDispatchRegistry<KpLogExponentOperationKind, KpLogExponentOperationDispatchEntry>(
    "log-exponent operation",
    [
      Object.freeze({
        id: "apply-natural-log-both-sides" as const,
        compile: (input: KpLogExponentCompilationInput) =>
          compileKpApplyNaturalLogBothSides({
            ...input,
            operation: input.operation as KpApplyNaturalLogBothSidesOperation
          })
      }),
      Object.freeze({
        id: "extract-log-power-exponent" as const,
        compile: (input: KpLogExponentCompilationInput) =>
          compileKpExtractLogPowerExponent({
            ...input,
            operation: input.operation as KpExtractLogPowerExponentOperation
          })
      }),
      Object.freeze({
        id: "divide-both-sides-by-log-base" as const,
        compile: (input: KpLogExponentCompilationInput) =>
          compileKpDivideByLogBase({
            ...input,
            operation: input.operation as KpDivideByLogBaseOperation
          })
      })
    ]
  );

export function compileKpRegisteredLogExponentOperation(
  input: KpLogExponentCompilationInput
): KpCompiledLogExponentOperation {
  return requireKpClosedDispatchEntry(
    kpLogExponentOperationDispatch,
    input.operation.kind
  ).compile(input);
}
