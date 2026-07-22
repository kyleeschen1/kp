import {
  createKpSemanticBranchSchedule,
  kpSequentialBranches,
  kpStaggeredBranches,
  kpSteppedBranches,
  kpTogetherBranches,
  type KpBranchPresentationStrategy,
  type KpSemanticBranchSchedule
} from "./branch-schedule.ts";
import {
  createKpSemanticBranchOperation,
  type KpSemanticBranchOperation
} from "../semantic/branch-operation.ts";

export type KpBalancedBranchPresentationStrategy =
  KpBranchPresentationStrategy["kind"];

export interface KpBalancedBranchScheduling {
  readonly branchOperation: KpSemanticBranchOperation;
  readonly branchSchedules: Readonly<
    Record<KpBalancedBranchPresentationStrategy, KpSemanticBranchSchedule>
  >;
  readonly branchSchedule: KpSemanticBranchSchedule;
}

export function createKpBalancedBranchScheduling(input: {
  readonly transformationId: string;
  readonly authorityId: string;
  readonly targetSelectorIds: readonly string[];
  readonly selectedStrategy: unknown;
}): KpBalancedBranchScheduling | undefined {
  if (input.selectedStrategy === undefined) return undefined;
  if (!isStrategy(input.selectedStrategy)) {
    throw new Error(
      `Transformation ${input.transformationId} has unknown branch strategy ${String(input.selectedStrategy)}.`
    );
  }
  const leftEntityIds = input.targetSelectorIds.filter((id) => id.includes(".lhs."));
  const rightEntityIds = input.targetSelectorIds.filter((id) => id.includes(".rhs."));
  if (
    leftEntityIds.length === 0 ||
    rightEntityIds.length === 0 ||
    leftEntityIds.length + rightEntityIds.length !== input.targetSelectorIds.length
  ) {
    throw new Error(
      `Balanced branch operation ${input.transformationId} requires explicit lhs and rhs selector roles.`
    );
  }
  const branchOperation = createKpSemanticBranchOperation({
    id: `operation.${input.transformationId}.balanced-branches`,
    authorityId: input.authorityId,
    branches: [
      { id: "lhs", entityIds: leftEntityIds, dependsOnBranchIds: [] },
      { id: "rhs", entityIds: rightEntityIds, dependsOnBranchIds: [] }
    ]
  });
  const branchSchedules = {
    together: createKpSemanticBranchSchedule({
      id: `schedule.${input.transformationId}.together`,
      operation: branchOperation,
      strategy: kpTogetherBranches()
    }),
    sequential: createKpSemanticBranchSchedule({
      id: `schedule.${input.transformationId}.sequential`,
      operation: branchOperation,
      strategy: kpSequentialBranches()
    }),
    staggered: createKpSemanticBranchSchedule({
      id: `schedule.${input.transformationId}.staggered`,
      operation: branchOperation,
      strategy: kpStaggeredBranches(0.5)
    }),
    stepped: createKpSemanticBranchSchedule({
      id: `schedule.${input.transformationId}.stepped`,
      operation: branchOperation,
      strategy: kpSteppedBranches()
    })
  };
  return {
    branchOperation,
    branchSchedules,
    branchSchedule: branchSchedules[input.selectedStrategy]
  };
}

function isStrategy(value: unknown): value is KpBalancedBranchPresentationStrategy {
  return value === "together" || value === "sequential" ||
    value === "staggered" || value === "stepped";
}
