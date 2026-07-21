import type { KpDevReviewStatusV1 } from "../protocols/dev-review-v1.ts";

const allowedTransitions: Readonly<Record<KpDevReviewStatusV1, readonly KpDevReviewStatusV1[]>> = {
  new: ["discussed", "grouped", "accepted", "dismissed"],
  discussed: ["grouped", "accepted", "dismissed"],
  grouped: ["discussed", "accepted", "dismissed"],
  accepted: ["discussed", "fixed", "dismissed"],
  fixed: ["accepted", "verified"],
  verified: ["accepted"],
  dismissed: ["discussed"]
};

export interface KpDevReviewLifecycleTransition {
  readonly from: KpDevReviewStatusV1;
  readonly to: KpDevReviewStatusV1;
  readonly reason?: string | undefined;
}

export function validateKpDevReviewLifecycleTransition(
  from: KpDevReviewStatusV1,
  to: KpDevReviewStatusV1,
  reason?: string
): KpDevReviewLifecycleTransition {
  if (from === to) throw new Error(`Review note is already ${to}`);
  if (!allowedTransitions[from].includes(to)) {
    throw new Error(`Review note cannot transition from ${from} to ${to}`);
  }
  const normalizedReason = reason?.trim();
  // Terminal decisions and their reversals need durable rationale because the
  // source comment itself remains immutable and cannot explain the projection.
  if ((to === "dismissed" || from === "dismissed" || from === "verified") && !normalizedReason) {
    throw new Error(`Review transition from ${from} to ${to} requires a reason`);
  }
  return {
    from,
    to,
    ...(normalizedReason === undefined ? {} : { reason: normalizedReason })
  };
}

export function listKpDevReviewLifecycleTargets(
  from: KpDevReviewStatusV1
): readonly KpDevReviewStatusV1[] {
  return [...allowedTransitions[from]];
}
