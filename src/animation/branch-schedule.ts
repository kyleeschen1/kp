import {
  orderedKpSemanticBranches,
  type KpSemanticBranchOperation
} from "../semantic/branch-operation.ts";

export type KpBranchPresentationStrategy =
  | { readonly kind: "together" }
  | { readonly kind: "sequential" }
  | { readonly kind: "staggered"; readonly overlap: number }
  | { readonly kind: "stepped" };

export interface KpBranchScheduleWindow<TId extends string = string> {
  readonly branchId: TId;
  readonly start: number;
  readonly end: number;
}

export interface KpSemanticBranchSchedule<TId extends string = string> {
  readonly id: string;
  readonly kind: "semantic-branch-schedule";
  readonly operation: KpSemanticBranchOperation<TId>;
  readonly strategy: KpBranchPresentationStrategy;
  readonly windows: readonly KpBranchScheduleWindow<TId>[];
  sample(progress: number): Readonly<Record<TId, number>>;
  sampleInverse(progress: number): Readonly<Record<TId, number>>;
}

export const kpTogetherBranches = (): KpBranchPresentationStrategy => ({
  kind: "together"
});
export const kpSequentialBranches = (): KpBranchPresentationStrategy => ({
  kind: "sequential"
});
export const kpStaggeredBranches = (
  overlap: number
): KpBranchPresentationStrategy => ({ kind: "staggered", overlap });
export const kpSteppedBranches = (): KpBranchPresentationStrategy => ({
  kind: "stepped"
});

export function createKpSemanticBranchSchedule<TId extends string>(input: {
  readonly id: string;
  readonly operation: KpSemanticBranchOperation<TId>;
  readonly strategy: KpBranchPresentationStrategy;
}): KpSemanticBranchSchedule<TId> {
  if (input.id.trim().length === 0) throw new Error("Semantic branch schedule id must not be empty.");
  if (
    input.strategy.kind === "staggered" &&
    (!Number.isFinite(input.strategy.overlap) ||
      input.strategy.overlap < 0 ||
      input.strategy.overlap >= 1)
  ) {
    throw new Error("Semantic branch stagger overlap must be at least zero and less than one.");
  }
  const windows = scheduleWindows(input.operation, input.strategy);
  const sample = (progress: number): Readonly<Record<TId, number>> => {
    const value = clamp01(progress);
    return Object.fromEntries(windows.map((window) => [
      window.branchId,
      input.strategy.kind === "stepped"
        ? Number(value >= window.end)
        : smoothstep(clamp01((value - window.start) / (window.end - window.start)))
    ])) as Readonly<Record<TId, number>>;
  };
  return {
    id: input.id,
    kind: "semantic-branch-schedule",
    operation: input.operation,
    strategy: input.strategy,
    windows,
    sample,
    sampleInverse(progress) {
      const inverseProgress = clamp01(progress);
      const forwardState = sample(1 - inverseProgress);
      return Object.fromEntries(input.operation.branches.map((branch) => [
        branch.id,
        1 - forwardState[branch.id]
      ])) as Readonly<Record<TId, number>>;
    }
  };
}

function scheduleWindows<TId extends string>(
  operation: KpSemanticBranchOperation<TId>,
  strategy: KpBranchPresentationStrategy
): readonly KpBranchScheduleWindow<TId>[] {
  const ordered = orderedKpSemanticBranches(operation);
  if (strategy.kind === "together") {
    const rankById = new Map<TId, number>();
    for (const branch of ordered) {
      rankById.set(branch.id, branch.dependsOnBranchIds.length === 0
        ? 0
        : Math.max(...branch.dependsOnBranchIds.map((id) => rankById.get(id)!)) + 1);
    }
    const rankCount = Math.max(...rankById.values()) + 1;
    return operation.branches.map((branch) => {
      const rank = rankById.get(branch.id)!;
      return { branchId: branch.id, start: rank / rankCount, end: (rank + 1) / rankCount };
    });
  }
  if (strategy.kind === "sequential" || strategy.kind === "stepped") {
    return ordered.map((branch, index) => ({
      branchId: branch.id,
      start: index / ordered.length,
      end: (index + 1) / ordered.length
    }));
  }
  const stride = 1 - strategy.overlap;
  const unscaled: KpBranchScheduleWindow<TId>[] = [];
  for (const [index, branch] of ordered.entries()) {
    const dependencyEnd = Math.max(
      0,
      ...branch.dependsOnBranchIds.map((dependencyId) =>
        unscaled.find((window) => window.branchId === dependencyId)!.end
      )
    );
    const previousStart = index === 0 ? -stride : unscaled[index - 1]!.start;
    const start = Math.max(previousStart + stride, dependencyEnd);
    unscaled.push({ branchId: branch.id, start, end: start + 1 });
  }
  const total = Math.max(...unscaled.map((window) => window.end));
  return unscaled.map((window) => ({
    branchId: window.branchId,
    start: window.start / total,
    end: window.end / total
  }));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Semantic branch progress must be finite.");
  return Math.max(0, Math.min(1, value));
}
