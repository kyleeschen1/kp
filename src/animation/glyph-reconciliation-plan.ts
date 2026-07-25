import type { KpCanonicalLineageProjection } from "./canonical-operation-lineage-adapter.ts";
import type { KpAnimationPresentationConstraintsV1 } from "./presentation-constraints.ts";

export type KpReconciliationDisposition =
  | "pending-measurement"
  | "matched"
  | "group-reconcile"
  | "settle"
  | "cut";

export interface KpGlyphReconciliationStep {
  readonly id: string;
  readonly lineageGroupId: string;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly disposition: KpReconciliationDisposition;
  readonly matchIds: readonly string[];
}

export interface KpEphemeralGlyphReconciliationPlan {
  readonly kind: "ephemeral-glyph-reconciliation-plan";
  readonly id: string;
  readonly lifecycle: "renderer-session";
  readonly lineageProjectionId: string;
  readonly constraints: KpAnimationPresentationConstraintsV1;
  readonly steps: readonly KpGlyphReconciliationStep[];
  readonly operationCount: number;
}

/**
 * This plan is a renderer-session value, never an AnimationAsset member. It
 * can contain later measurements and backend instructions without creating a
 * second durable semantic format.
 */
export function createKpEphemeralGlyphReconciliationPlan(input: {
  readonly id: string;
  readonly lineage: KpCanonicalLineageProjection;
  readonly constraints: KpAnimationPresentationConstraintsV1;
}): KpEphemeralGlyphReconciliationPlan {
  if (input.id.trim().length === 0) throw new Error("Reconciliation plan id must not be empty.");
  if (
    input.constraints.lineageAuthority !== "canonical-operation-executor" ||
    input.constraints.glyphMatching !== "within-semantic-lineage-only"
  ) {
    throw new Error("Reconciliation plan requires canonical lineage-constrained matching.");
  }
  const steps = input.lineage.groups.map((group) => ({
    id: `${input.id}.${group.id}`,
    lineageGroupId: group.id,
    sourceEntityIds: Object.freeze([...group.sourceEntityIds]),
    targetEntityIds: Object.freeze([...group.targetEntityIds]),
    disposition: "pending-measurement" as const,
    matchIds: Object.freeze([] as string[])
  }));
  if (steps.length > input.constraints.maxPlannerOperations) {
    throw new Error(
      `Reconciliation plan requires ${steps.length} operations; limit is ${input.constraints.maxPlannerOperations}.`
    );
  }

  return Object.freeze({
    kind: "ephemeral-glyph-reconciliation-plan",
    id: input.id,
    lifecycle: "renderer-session",
    lineageProjectionId: input.lineage.id,
    constraints: input.constraints,
    steps: Object.freeze(steps.map((step) => Object.freeze(step))),
    operationCount: steps.length
  });
}

export function replaceKpReconciliationSteps(
  plan: KpEphemeralGlyphReconciliationPlan,
  steps: readonly KpGlyphReconciliationStep[],
  operationCount = plan.operationCount
): KpEphemeralGlyphReconciliationPlan {
  if (operationCount > plan.constraints.maxPlannerOperations) {
    throw new Error(
      `Reconciliation plan requires ${operationCount} operations; limit is ${plan.constraints.maxPlannerOperations}.`
    );
  }
  return Object.freeze({
    ...plan,
    steps: Object.freeze(steps.map((step) => Object.freeze({
      ...step,
      sourceEntityIds: Object.freeze([...step.sourceEntityIds]),
      targetEntityIds: Object.freeze([...step.targetEntityIds]),
      matchIds: Object.freeze([...step.matchIds])
    }))),
    operationCount
  });
}
