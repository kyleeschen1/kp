import {
  compileKpEquationTransformSeries,
  type KpCompiledEquationTransformSeriesCandidate,
  type KpEquationTransformSeriesCompilationState
} from "./compile-equation-transform-series.ts";
import { bindKpEquationSeriesGovernedRequest } from
  "./equation-series-governed-source-binding.ts";
import type { KpEquationSeriesVerifiedSemanticSource } from
  "./equation-series-governed-source.ts";
import {
  runKpEquationSeriesNaturalLanguagePlanner,
  type KpEquationSeriesNaturalLanguagePlannerPort,
  type KpEquationSeriesPlannerDiagnostic,
  type KpEquationSeriesPlannerRecord,
  type KpEquationSeriesPlannerUnsupportedRecord
} from "./equation-series-natural-language-planner-port.ts";
import type { KpEquationSeriesExternalDiagnostic } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationSeriesRepair } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";

export type KpNaturalLanguageEquationSeriesRecovery =
  | Readonly<{
      readonly disposition: "compiled-new-candidate";
      readonly active: KpCompiledEquationTransformSeriesCandidate;
    }>
  | Readonly<{
      readonly disposition: "retained-last-valid";
      readonly active: KpCompiledEquationTransformSeriesCandidate;
    }>
  | Readonly<{
      readonly disposition: "no-valid-candidate";
    }>;

export type KpNaturalLanguageEquationSeriesCompilationResult =
  | Readonly<{
      readonly status: "compiled";
      readonly plannerRecord: KpEquationSeriesPlannerRecord;
      readonly boundRequest: KpEquationTransformSeriesRequest;
      readonly compilation: KpEquationTransformSeriesCompilationState &
        Readonly<{
          readonly status: "compiled";
          readonly active: KpCompiledEquationTransformSeriesCandidate;
        }>;
      readonly recovery: Extract<KpNaturalLanguageEquationSeriesRecovery,
        { readonly disposition: "compiled-new-candidate" }>;
    }>
  | Readonly<{
      readonly status: "repair-required";
      readonly plannerRecord?: KpEquationSeriesPlannerRecord | undefined;
      readonly boundRequest?: KpEquationTransformSeriesRequest | undefined;
      readonly compilation: KpEquationTransformSeriesCompilationState &
        Readonly<{ readonly status: "repair-required" }>;
      readonly repairs: readonly KpEquationSeriesRepair[];
      readonly recovery: Exclude<KpNaturalLanguageEquationSeriesRecovery,
        { readonly disposition: "compiled-new-candidate" }>;
    }>
  | Readonly<{
      readonly status: "unsupported";
      readonly plannerRecord: KpEquationSeriesPlannerUnsupportedRecord;
      readonly recovery: Exclude<KpNaturalLanguageEquationSeriesRecovery,
        { readonly disposition: "compiled-new-candidate" }>;
    }>;

/**
 * This is the narrow orchestration boundary: probabilistic selection ends
 * before deterministic source binding, validation, and compilation begin.
 */
export async function compileNaturalLanguageKpEquationSeries(input: {
  readonly request: KpEquationTransformSeriesRequest;
  readonly naturalLanguageIntent: string;
  readonly planner: KpEquationSeriesNaturalLanguagePlannerPort;
  readonly governedSources?:
    readonly KpEquationSeriesVerifiedSemanticSource[] | undefined;
  readonly previous?: KpEquationTransformSeriesCompilationState | undefined;
}): Promise<KpNaturalLanguageEquationSeriesCompilationResult> {
  const planned = await runKpEquationSeriesNaturalLanguagePlanner({
    request: input.request,
    naturalLanguageIntent: input.naturalLanguageIntent,
    port: input.planner
  });
  if (planned.status === "unsupported") return Object.freeze({
    status: "unsupported" as const,
    plannerRecord: planned.record,
    recovery: previousRecovery(input.previous)
  });
  if (planned.status === "repair-required") {
    const compilation = compileKpEquationTransformSeries({
      value: input.request,
      previous: input.previous,
      externalDiagnostics: planned.diagnostics.map(plannerDiagnostic)
    });
    return repairResult({ compilation: requireRepairCompilation(compilation) });
  }
  const binding = bindKpEquationSeriesGovernedRequest({
    request: input.request,
    proposals: planned.record.proposals,
    ...(input.governedSources === undefined
      ? {}
      : { sources: input.governedSources })
  });
  if (binding.status === "repair-required") {
    const compilation = compileKpEquationTransformSeries({
      value: input.request,
      previous: input.previous,
      externalDiagnostics: binding.diagnostics
    });
    return repairResult({
      plannerRecord: planned.record,
      compilation: requireRepairCompilation(compilation)
    });
  }
  const compilation = compileKpEquationTransformSeries({
    value: binding.request,
    previous: input.previous,
    governedSources: input.governedSources
  });
  if (compilation.status === "repair-required") return repairResult({
    plannerRecord: planned.record,
    boundRequest: binding.request,
    compilation: requireRepairCompilation(compilation)
  });
  const active = compilation.active;
  if (active === undefined) {
    throw new Error("Compiled equation series must expose its active candidate.");
  }
  const compiledState = Object.freeze({
    ...compilation,
    status: "compiled" as const,
    active
  });
  return Object.freeze({
    status: "compiled" as const,
    plannerRecord: planned.record,
    boundRequest: binding.request,
    compilation: compiledState,
    recovery: Object.freeze({
      disposition: "compiled-new-candidate" as const,
      active
    })
  }) as KpNaturalLanguageEquationSeriesCompilationResult;
}

function repairResult(input: {
  readonly plannerRecord?: KpEquationSeriesPlannerRecord | undefined;
  readonly boundRequest?: KpEquationTransformSeriesRequest | undefined;
  readonly compilation: KpEquationTransformSeriesCompilationState &
    Readonly<{ readonly status: "repair-required" }>;
}): Extract<KpNaturalLanguageEquationSeriesCompilationResult,
  { readonly status: "repair-required" }> {
  return Object.freeze({
    status: "repair-required" as const,
    ...(input.plannerRecord === undefined
      ? {}
      : { plannerRecord: input.plannerRecord }),
    ...(input.boundRequest === undefined
      ? {}
      : { boundRequest: input.boundRequest }),
    compilation: input.compilation,
    repairs: input.compilation.repairs,
    recovery: previousRecovery(input.compilation)
  });
}

function requireRepairCompilation(
  compilation: KpEquationTransformSeriesCompilationState
): KpEquationTransformSeriesCompilationState &
  Readonly<{ readonly status: "repair-required" }> {
  if (compilation.status !== "repair-required") {
    throw new Error("Repair path unexpectedly produced a compiled candidate.");
  }
  return Object.freeze({ ...compilation, status: "repair-required" as const });
}

function previousRecovery(
  state: KpEquationTransformSeriesCompilationState | undefined
): Exclude<KpNaturalLanguageEquationSeriesRecovery,
  { readonly disposition: "compiled-new-candidate" }> {
  return state?.active === undefined
    ? Object.freeze({ disposition: "no-valid-candidate" as const })
    : Object.freeze({
        disposition: "retained-last-valid" as const,
        active: state.active
      });
}

function plannerDiagnostic(
  diagnostic: KpEquationSeriesPlannerDiagnostic
): KpEquationSeriesExternalDiagnostic {
  return Object.freeze({
    code: diagnostic.code,
    path: diagnostic.path,
    message: diagnostic.message,
    repair: diagnostic.repair
  });
}
