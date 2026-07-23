export type KpAnimationRoadmapState =
  | "now"
  | "next"
  | "later"
  | "deferred"
  | "untracked";

export type KpAnimationExecutionState =
  | "active"
  | "queued"
  | "blocked"
  | "complete"
  | "not-scheduled";

export type KpAnimationMaturityState =
  | "proposed"
  | "experimental"
  | "reviewable"
  | "approved"
  | "promoted";

export type KpAnimationReviewState =
  | "unreviewed"
  | "awaiting-review"
  | "changes-requested"
  | "approved";

export type KpAnimationVerificationState =
  | "unknown"
  | "passing"
  | "failing";

export type KpAnimationPlayabilityState =
  | "playable"
  | "planned-only"
  | "unavailable";

export interface KpAnimationLifecycleFacets {
  readonly schemaVersion: "kp.animation-lifecycle-facets.v1";
  readonly roadmap: KpAnimationRoadmapState;
  readonly execution: KpAnimationExecutionState;
  readonly maturity: KpAnimationMaturityState;
  readonly review: KpAnimationReviewState;
  readonly verification: KpAnimationVerificationState;
  readonly playability: KpAnimationPlayabilityState;
}

export function createKpAnimationLifecycleFacets(
  input: Omit<KpAnimationLifecycleFacets, "schemaVersion">
): KpAnimationLifecycleFacets {
  if (input.playability === "planned-only" && input.execution === "complete") {
    throw new Error("A planned-only animation cannot have complete execution.");
  }
  if (input.review === "approved" && input.maturity === "proposed") {
    throw new Error("An approved review cannot point to proposed-only maturity.");
  }
  if (input.maturity === "promoted" && input.review !== "approved") {
    throw new Error("A promoted animation requires approved review evidence.");
  }
  return {
    schemaVersion: "kp.animation-lifecycle-facets.v1",
    ...input
  };
}
