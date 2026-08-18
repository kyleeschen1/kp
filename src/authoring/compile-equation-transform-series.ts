import {
  normalizeKpEquationTransformSeriesEndpoints,
  type KpNormalizedEquationTransformSeriesState
} from "./equation-latex-endpoint-normalizer.ts";
import {
  resolveKpEquationSeriesIntents,
  type KpEquationSeriesIntentProposal
} from "./equation-series-intent-resolver.ts";
import {
  compileKpEquationSeriesRuntime,
  type KpEquationSeriesRuntime
} from "./equation-series-runtime.ts";
import {
  createKpEquationSeriesFrontendUnavailableRepair,
  repairsForKpEquationSeriesExternalDiagnostics,
  repairsForKpEquationSeriesRequest,
  repairsForKpEquationSeriesRuntime,
  repairsForKpEquationSeriesSegmentation,
  repairsForKpEquationSeriesSyntax,
  type KpEquationSeriesExternalDiagnostic,
  type KpEquationSeriesRepair
} from "./equation-series-repair-taxonomy.ts";
import {
  validateKpEquationTransformSeriesRequest,
  type KpEquationTransformSeriesRequest
} from "./equation-transform-series-request.ts";
import {
  validateKpEquationSeriesBothSidesAuthoring,
  type KpEquationSeriesVerifiedSemanticSource
} from "./equation-series-both-sides-authoring.ts";

export interface KpCompiledEquationTransformSeriesCandidate {
  readonly request: KpEquationTransformSeriesRequest;
  readonly normalizedStates:
    readonly KpNormalizedEquationTransformSeriesState[];
  readonly runtime: KpEquationSeriesRuntime;
}

export interface KpEquationTransformSeriesCompilationState {
  readonly status: "compiled" | "repair-required";
  readonly active?: KpCompiledEquationTransformSeriesCandidate | undefined;
  readonly repairs: readonly KpEquationSeriesRepair[];
}

export function compileKpEquationTransformSeries(input: {
  readonly value: unknown;
  readonly previous?: KpEquationTransformSeriesCompilationState | undefined;
  readonly proposals?: readonly KpEquationSeriesIntentProposal[] | undefined;
  readonly externalDiagnostics?:
    readonly KpEquationSeriesExternalDiagnostic[] | undefined;
  readonly frontendAvailability?: Readonly<{
    domain: string;
    frontendId: string;
    status: "available" | "unavailable";
    reason?: string | undefined;
  }> | undefined;
  readonly governedSources?:
    readonly KpEquationSeriesVerifiedSemanticSource[] | undefined;
}): KpEquationTransformSeriesCompilationState {
  if (input.frontendAvailability?.status === "unavailable") return failed(
    input.previous,
    [createKpEquationSeriesFrontendUnavailableRepair({
      domain: input.frontendAvailability.domain,
      frontendId: input.frontendAvailability.frontendId,
      message: input.frontendAvailability.reason ??
        "The selected domain frontend is not available."
    })]
  );
  if ((input.externalDiagnostics?.length ?? 0) > 0) return failed(
    input.previous,
    repairsForKpEquationSeriesExternalDiagnostics(input.externalDiagnostics!)
  );
  const validated = validateKpEquationTransformSeriesRequest(input.value);
  if (validated.status !== "accepted") return failed(
    input.previous,
    repairsForKpEquationSeriesRequest(validated.diagnostics)
  );
  const normalized = normalizeKpEquationTransformSeriesEndpoints(
    validated.request
  );
  if (normalized.status !== "normalized") return failed(
    input.previous,
    repairsForKpEquationSeriesSyntax(normalized.diagnostics)
  );
  const resolution = resolveKpEquationSeriesIntents({
    request: validated.request,
    proposals: input.proposals
  });
  if (resolution.status !== "resolved") return failed(
    input.previous,
    repairsForKpEquationSeriesSegmentation({
      request: validated.request,
      repairs: resolution.repairs
    })
  );
  const governedBothSidesDiagnostics =
    validateKpEquationSeriesBothSidesAuthoring({
      request: validated.request,
      resolution,
      sourceAuthorities: input.governedSources
    });
  if (governedBothSidesDiagnostics.length > 0) return failed(
    input.previous,
    repairsForKpEquationSeriesExternalDiagnostics(
      governedBothSidesDiagnostics
    )
  );
  const compiled = compileKpEquationSeriesRuntime({
    id: `runtime.${validated.request.id}`,
    request: validated.request,
    resolution
  });
  if (compiled.status !== "compiled") return failed(
    input.previous,
    repairsForKpEquationSeriesRuntime(compiled.issues)
  );
  return deepFreeze({
    status: "compiled" as const,
    active: {
      request: validated.request,
      normalizedStates: normalized.states,
      runtime: compiled.runtime
    },
    repairs: []
  });
}

function failed(
  previous: KpEquationTransformSeriesCompilationState | undefined,
  repairs: readonly KpEquationSeriesRepair[]
): KpEquationTransformSeriesCompilationState {
  return Object.freeze({
    status: "repair-required" as const,
    ...(previous?.active === undefined ? {} : { active: previous.active }),
    repairs: Object.freeze([...repairs])
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
