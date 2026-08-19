import {
  compileKpEquationTransformSeries,
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
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";

export type KpNaturalLanguageEquationSeriesCompilationResult =
  | Readonly<{
      readonly status: "compiled" | "repair-required";
      readonly plannerRecord?: KpEquationSeriesPlannerRecord | undefined;
      readonly boundRequest?: KpEquationTransformSeriesRequest | undefined;
      readonly compilation: KpEquationTransformSeriesCompilationState;
    }>
  | Readonly<{
      readonly status: "unsupported";
      readonly plannerRecord: KpEquationSeriesPlannerUnsupportedRecord;
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
    plannerRecord: planned.record
  });
  if (planned.status === "repair-required") {
    const compilation = compileKpEquationTransformSeries({
      value: input.request,
      previous: input.previous,
      externalDiagnostics: planned.diagnostics.map(plannerDiagnostic)
    });
    return Object.freeze({ status: "repair-required" as const, compilation });
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
    return Object.freeze({
      status: "repair-required" as const,
      plannerRecord: planned.record,
      compilation
    });
  }
  const compilation = compileKpEquationTransformSeries({
    value: binding.request,
    previous: input.previous,
    governedSources: input.governedSources
  });
  return Object.freeze({
    status: compilation.status,
    plannerRecord: planned.record,
    boundRequest: binding.request,
    compilation
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
