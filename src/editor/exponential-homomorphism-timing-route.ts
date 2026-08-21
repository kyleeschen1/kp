import { requireKpExponentialHomomorphismTopologyPhasePolicy } from
  "../rendering/exponential-homomorphism-topology-phase-policy.ts";

export interface KpExponentialHomomorphismTimingRoute {
  readonly enabled: boolean;
  readonly resolutionStart: number;
  readonly resolutionEnd: number;
}

const START_PARAM = "crossoverStart";
const END_PARAM = "crossoverEnd";
const TUNER_PARAM = "tuneCrossover";

export function readKpExponentialHomomorphismTimingRoute(
  search: string
): KpExponentialHomomorphismTimingRoute {
  const params = new URLSearchParams(search);
  const defaults = requireKpExponentialHomomorphismTopologyPhasePolicy(
    "lateral-product"
  ).outwardTransit;
  const resolutionStart = finiteParam(params.get(START_PARAM), defaults.start);
  const resolutionEnd = finiteParam(params.get(END_PARAM), defaults.end);
  const valid = isValidWindow(resolutionStart, resolutionEnd);
  return Object.freeze({
    enabled: params.get(TUNER_PARAM) === "1",
    resolutionStart: valid ? resolutionStart : defaults.start,
    resolutionEnd: valid ? resolutionEnd : defaults.end
  });
}

export function writeKpExponentialHomomorphismTimingRoute(
  search: string,
  input: Readonly<{
    enabled: boolean;
    resolutionStart: number;
    resolutionEnd: number;
  }>
): string {
  if (!isValidWindow(input.resolutionStart, input.resolutionEnd)) {
    throw new Error(
      "Exponential crossover timing requires a finite ordered window of at least 0.04."
    );
  }
  const params = new URLSearchParams(search);
  if (input.enabled) params.set(TUNER_PARAM, "1");
  else params.delete(TUNER_PARAM);
  params.set(START_PARAM, format(input.resolutionStart));
  params.set(END_PARAM, format(input.resolutionEnd));
  return `?${params.toString()}`;
}

export function projectKpExponentialHomomorphismPresentationProgress(
  progress: number,
  route: KpExponentialHomomorphismTimingRoute
): number {
  const bounded = Math.max(0, Math.min(1, progress));
  if (!route.enabled) return bounded;
  const canonical = requireKpExponentialHomomorphismTopologyPhasePolicy(
    "lateral-product"
  ).outwardTransit;
  // Presentation tuning time-warps the reviewed collision-safe choreography;
  // it must not rewrite the semantic tracks or their paint-safety schedule.
  if (bounded <= route.resolutionStart) {
    return route.resolutionStart === 0
      ? canonical.start
      : bounded / route.resolutionStart * canonical.start;
  }
  if (bounded <= route.resolutionEnd) {
    const local = (bounded - route.resolutionStart) /
      (route.resolutionEnd - route.resolutionStart);
    return canonical.start + local * (canonical.end - canonical.start);
  }
  return canonical.end +
    (bounded - route.resolutionEnd) /
      (1 - route.resolutionEnd) * (1 - canonical.end);
}

function finiteParam(value: string | null, fallback: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isValidWindow(start: number, end: number): boolean {
  return Number.isFinite(start) &&
    Number.isFinite(end) &&
    start >= 0 &&
    end <= 0.9 &&
    end - start >= 0.04;
}

function format(value: number): string {
  return value.toFixed(2);
}
