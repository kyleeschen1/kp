import type { KpAnimationRuntimeClock } from
  "../animation/runtime-sampler.ts";
import {
  KP_SYNCHRONIZED_MODEL_PROGRESS_DENOMINATOR,
  quantizeKpSynchronizedModelProgress,
  sampleKpSynchronizedModelProjectionProgress
} from "../animation/synchronized-model-projection.ts";
import type {
  KpEquationSeriesIntentResolutionResult,
  KpResolvedEquationSeriesAdjacencyPlan
} from "./equation-series-intent-resolver.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";

export interface KpEquationSeriesCheckpoint {
  readonly id: string;
  readonly index: number;
  readonly stateId: string;
  readonly position: Readonly<{
    numerator: number;
    denominator: number;
  }>;
  readonly progress: number;
}

export interface KpEquationSeriesRuntime {
  readonly schemaVersion: "kp.equation-series-runtime.v1";
  readonly kind: "equation-series-runtime";
  readonly id: string;
  readonly requestId: string;
  readonly plans: readonly KpResolvedEquationSeriesAdjacencyPlan[];
  readonly checkpoints: readonly KpEquationSeriesCheckpoint[];
}

export interface KpEquationSeriesRuntimeFrame {
  readonly runtimeId: string;
  readonly clock: KpAnimationRuntimeClock;
  readonly presentationProgress: number;
  readonly activePlanIndex: number;
  readonly activePlan: KpResolvedEquationSeriesAdjacencyPlan;
  readonly activePlanProgress: number;
  readonly sourceCheckpointId: string;
  readonly targetCheckpointId: string;
  readonly settledCheckpointId?: string | undefined;
}

export interface KpEquationSeriesRuntimeIssue {
  readonly code:
    | "equation-series.runtime.id"
    | "equation-series.runtime.unresolved"
    | "equation-series.runtime.plan-count"
    | "equation-series.runtime.plan-order";
  readonly path: string;
  readonly message: string;
}

export type KpEquationSeriesRuntimeCompileResult =
  | Readonly<{
      status: "compiled";
      runtime: KpEquationSeriesRuntime;
      issues: readonly [];
    }>
  | Readonly<{
      status: "repair-required";
      issues: readonly KpEquationSeriesRuntimeIssue[];
    }>;

const runtimeIdPattern = /^[a-z][a-z0-9]*(?:[._:-][a-z0-9]+)+$/u;
const KP_EQUATION_SERIES_FLOAT_EPSILON = 1e-12;

export function compileKpEquationSeriesRuntime(input: {
  readonly id: string;
  readonly request: KpEquationTransformSeriesRequest;
  readonly resolution: KpEquationSeriesIntentResolutionResult;
}): KpEquationSeriesRuntimeCompileResult {
  const issues: KpEquationSeriesRuntimeIssue[] = [];
  if (!runtimeIdPattern.test(input.id)) issues.push(issue(
    "equation-series.runtime.id",
    "$.id",
    "Equation series runtime requires a stable protocol id."
  ));
  if (input.resolution.status !== "resolved") issues.push(issue(
    "equation-series.runtime.unresolved",
    "$.resolution",
    "Only a fully resolved series can become an active runtime."
  ));
  const plans = input.resolution.status === "resolved"
    ? input.resolution.plans
    : [];
  if (plans.length !== input.request.adjacencies.length) issues.push(issue(
    "equation-series.runtime.plan-count",
    "$.resolution.plans",
    "Runtime plans must cover every request adjacency exactly once."
  ));
  input.request.adjacencies.forEach((adjacency, index) => {
    const plan = plans[index];
    if (
      plan === undefined ||
      plan.id !== adjacency.id ||
      plan.fromStateId !== adjacency.fromStateId ||
      plan.toStateId !== adjacency.toStateId
    ) issues.push(issue(
      "equation-series.runtime.plan-order",
      `$.resolution.plans[${index}]`,
      `Runtime plan ${index} must preserve the request adjacency and endpoints.`
    ));
  });
  if (issues.length > 0) return deepFreeze({
    status: "repair-required" as const,
    issues
  });

  const denominator = plans.length;
  const checkpoints = input.request.states.map((state, index) => deepFreeze({
    id: `${input.id}.checkpoint.${index}.${state.id}`,
    index,
    stateId: state.id,
    position: { numerator: index, denominator },
    progress: quantizeKpSynchronizedModelProgress(index / denominator)
  }));
  return deepFreeze({
    status: "compiled" as const,
    runtime: {
      schemaVersion: "kp.equation-series-runtime.v1" as const,
      kind: "equation-series-runtime" as const,
      id: input.id,
      requestId: input.request.id,
      plans: plans.map(clonePlan),
      checkpoints
    },
    issues: [] as []
  });
}

/** Pure projection: every navigation path samples the same shared clock. */
export function sampleKpEquationSeriesRuntime(
  runtime: KpEquationSeriesRuntime,
  clock: KpAnimationRuntimeClock
): KpEquationSeriesRuntimeFrame {
  const projected = sampleKpSynchronizedModelProjectionProgress(clock);
  const transitionCount = runtime.plans.length;
  const scaled = snapBoundary(
    projected.presentationProgress * transitionCount,
    transitionCount
  );
  const exactBoundary = Number.isInteger(scaled);
  const activePlanIndex = scaled >= transitionCount
    ? transitionCount - 1
    : Math.floor(scaled);
  const activePlanProgress = scaled >= transitionCount
    ? 1
    : quantizeKpSynchronizedModelProgress(scaled - activePlanIndex);
  const activePlan = runtime.plans[activePlanIndex]!;
  const sourceCheckpoint = runtime.checkpoints[activePlanIndex]!;
  const targetCheckpoint = runtime.checkpoints[activePlanIndex + 1]!;
  const settledCheckpoint = exactBoundary
    ? runtime.checkpoints[Math.round(scaled)]
    : undefined;
  return deepFreeze({
    runtimeId: runtime.id,
    clock: { ...clock, progress: projected.progress },
    presentationProgress: projected.presentationProgress,
    activePlanIndex,
    activePlan,
    activePlanProgress,
    sourceCheckpointId: sourceCheckpoint.id,
    targetCheckpointId: targetCheckpoint.id,
    ...(settledCheckpoint === undefined
      ? {}
      : { settledCheckpointId: settledCheckpoint.id })
  });
}

export function seekKpEquationSeriesCheckpoint(input: {
  readonly runtime: KpEquationSeriesRuntime;
  readonly checkpointId: string;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpEquationSeriesRuntimeFrame | undefined {
  const checkpoint = input.runtime.checkpoints.find(
    ({ id }) => id === input.checkpointId
  );
  if (checkpoint === undefined) return undefined;
  const direction = input.direction ?? "forward";
  return sampleKpEquationSeriesRuntime(input.runtime, {
    direction,
    progress: direction === "forward"
      ? checkpoint.progress
      : quantizeKpSynchronizedModelProgress(1 - checkpoint.progress)
  });
}

function clonePlan(
  plan: KpResolvedEquationSeriesAdjacencyPlan
): KpResolvedEquationSeriesAdjacencyPlan {
  return deepFreeze({
    ...plan,
    intent: plan.intent.mode === "explicit"
      ? {
          ...plan.intent,
          semanticArguments: immutableCopy(plan.intent.semanticArguments)
        }
      : { ...plan.intent },
    declaration: {
      ...plan.declaration,
      recipeIds: [...plan.declaration.recipeIds],
      authorityRefIds: [...plan.declaration.authorityRefIds],
      roleIds: [...plan.declaration.roleIds],
      canonicalComposition: [...plan.declaration.canonicalComposition]
    }
  });
}

function snapBoundary(value: number, transitionCount: number): number {
  const boundary = Math.round(value);
  const projectionTolerance = transitionCount /
    (2 * KP_SYNCHRONIZED_MODEL_PROGRESS_DENOMINATOR);
  return Math.abs(value - boundary) <=
    projectionTolerance + KP_EQUATION_SERIES_FLOAT_EPSILON
    ? boundary
    : value;
}

function issue(
  code: KpEquationSeriesRuntimeIssue["code"],
  path: string,
  message: string
): KpEquationSeriesRuntimeIssue {
  return Object.freeze({ code, path, message });
}

function immutableCopy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(immutableCopy);
  if (typeof value === "object" && value !== null) return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, immutableCopy(child)])
  );
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
