import {
  createKpCausalChainPlan,
  type KpCausalChainPlan
} from "../animation/compressed-causal-chain.ts";
import {
  createKpCausalChainDrillDown,
  type KpCausalChainDrillDown
} from "../animation/causal-chain-drilldown.ts";
import {
  createKpGovernedCanonicalConstructionCohort
} from "./governed-canonical-construction-cohort.ts";
import type {
  KpCanonicalAnimationConstructionArtifact
} from "./canonical-animation-construction.ts";

export interface KpGovernedCanonicalCompoundOperation {
  readonly id: string;
  readonly semanticRank: number;
  readonly childId: string;
  readonly constructionId: string;
  readonly stepId: string;
  readonly transformationId: string;
  readonly definitionId: string;
}

export interface KpGovernedCanonicalCompoundConstruction {
  readonly kind: "governed-canonical-compound-construction";
  readonly id: "construction.compound.governed-variation-cohort.v1";
  readonly children: readonly {
    readonly id: string;
    readonly fixtureId: string;
    readonly construction: KpCanonicalAnimationConstructionArtifact;
  }[];
  readonly operations: readonly KpGovernedCanonicalCompoundOperation[];
  readonly clock: KpCausalChainPlan;
  readonly fullDetail: KpCausalChainPlan;
  readonly drillDown?: KpCausalChainDrillDown;
}

export interface KpGovernedCanonicalCompoundFrame {
  readonly kind: "governed-canonical-compound-frame";
  readonly progress: number;
  readonly elapsedMs: number;
  readonly operationIndex: number;
  readonly operationId: string;
  readonly localProgress: number;
}

/**
 * Compiles verified child constructions onto the existing causal-chain clock.
 * Durations are compiler-owned presentation output, never provider input.
 */
export function createKpGovernedCanonicalCompoundConstruction(input: {
  readonly parentProgress?: number;
  readonly includeDrillDown?: boolean;
} = {}): KpGovernedCanonicalCompoundConstruction {
  const cohort = createKpGovernedCanonicalConstructionCohort();
  const operations = cohort.flatMap((member) =>
    member.compilation.construction.operations.map((operation) => ({
      childId: member.id,
      fixtureId: member.fixtureId,
      constructionId: member.compilation.construction.id,
      operation
    }))
  ).map((entry, semanticRank) => Object.freeze({
    id: `compound-operation.${semanticRank}.${entry.operation.stepId}`,
    semanticRank,
    childId: entry.childId,
    constructionId: entry.constructionId,
    stepId: entry.operation.stepId,
    transformationId: entry.operation.transformationId,
    definitionId: entry.operation.definitionId
  }));
  const actions = operations.map((operation, semanticRank) => Object.freeze({
    id: operation.id,
    semanticRank,
    canonicalOperationId: operation.transformationId,
    dependsOnActionIds: Object.freeze(
      semanticRank === 0 ? [] : [operations[semanticRank - 1]!.id]
    ),
    fullDurationMs: 720,
    minimumVisibleDurationMs: 140
  }));
  const clock = createKpCausalChainPlan({
    id: "causal-chain.governed-variation-cohort.compound",
    presentation: "compressed-context",
    actions,
    compressedDurationMsByActionId: Object.fromEntries(
      actions.map(({ id }) => [id, 180])
    )
  });
  const fullDetail = createKpCausalChainPlan({
    id: "causal-chain.governed-variation-cohort.full",
    presentation: "full-detail",
    actions
  });
  const parentProgress = input.parentProgress ?? 0.5;
  if (
    !Number.isFinite(parentProgress) ||
    parentProgress < 0 ||
    parentProgress > 1
  ) {
    throw new Error("Compound parent progress must be normalized.");
  }
  const drillDown = input.includeDrillDown === false
    ? undefined
    : createKpCausalChainDrillDown({
        id: "drilldown.governed-variation-cohort",
        parentPlan: clock,
        childPlan: fullDetail,
        parentElapsedMs: parentProgress * clock.totalDurationMs
      });
  return deepFreeze({
    kind: "governed-canonical-compound-construction" as const,
    id: "construction.compound.governed-variation-cohort.v1" as const,
    children: cohort.map((member) => ({
      id: member.id,
      fixtureId: member.fixtureId,
      construction: member.compilation.construction
    })),
    operations,
    clock,
    fullDetail,
    ...(drillDown === undefined ? {} : { drillDown })
  });
}

/**
 * Samples the existing causal-chain plan directly; it does not own a clock or
 * retain previous frames, so forward, rewind, and arbitrary seek are identical.
 */
export function sampleKpGovernedCanonicalCompoundConstruction(
  construction: KpGovernedCanonicalCompoundConstruction,
  progress: number
): KpGovernedCanonicalCompoundFrame {
  if (!Number.isFinite(progress)) {
    throw new Error("Compound construction progress must be finite.");
  }
  const bounded = Math.max(0, Math.min(1, progress));
  const elapsedMs = bounded * construction.clock.totalDurationMs;
  const operationIndex = elapsedMs === construction.clock.totalDurationMs
    ? construction.clock.segments.length - 1
    : construction.clock.segments.findIndex(
        ({ endMs }) => elapsedMs < endMs
      );
  const segment = construction.clock.segments[operationIndex]!;
  const localProgress = bounded === 1
    ? 1
    : Math.max(
        0,
        Math.min(
          1,
          (elapsedMs - segment.startMs) / segment.durationMs
        )
      );
  return Object.freeze({
    kind: "governed-canonical-compound-frame",
    progress: bounded,
    elapsedMs,
    operationIndex,
    operationId: segment.canonicalOperationId,
    localProgress
  });
}

function deepFreeze<T>(value: T): T {
  if (
    value === null ||
    typeof value !== "object" ||
    Object.isFrozen(value)
  ) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}
