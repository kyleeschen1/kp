import type { KpCancellationPresentationIntent } from "./cancellation-presentation-intent.ts";

export type KpCancellationOperationId =
  | "kp.algebra.cancel-additive-inverses"
  | "kp.algebra.cancel-multiplicative-inverses";

export type KpCancellationTeachingGoal =
  | "preserve-flow"
  | "make-identity-visible";

export interface KpCancellationPresentationRequest {
  readonly operationId: KpCancellationOperationId;
  readonly teachingGoal: KpCancellationTeachingGoal;
}

/**
 * Authors state semantic authority and a teaching goal; renderer policy remains
 * inferred. This keeps generated lessons durable as visual recipes improve.
 */
export function inferKpCancellationPresentationIntent(
  request: KpCancellationPresentationRequest
): KpCancellationPresentationIntent {
  return Object.freeze({
    contact: "shared-center",
    approach: "opposing-arcs",
    identityBeat:
      request.teachingGoal === "make-identity-visible" ? "explicit" : "implicit",
    retirement: "after-contact",
    readability: "through-contact"
  });
}
