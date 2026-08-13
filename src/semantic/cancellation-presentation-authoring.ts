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

export function kpCancellationOperationIdForTransformType(
  transformType: string
): KpCancellationOperationId | undefined {
  switch (transformType) {
    case "cancelAdditiveInverses":
      return "kp.algebra.cancel-additive-inverses";
    case "cancelMultiplicativeInverses":
    case "projectCertifiedFractionTransfer":
      return "kp.algebra.cancel-multiplicative-inverses";
    default:
      return undefined;
  }
}

/** Generated requests may express intent without selecting renderer recipes. */
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
