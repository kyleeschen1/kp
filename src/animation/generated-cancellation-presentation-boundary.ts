import {
  inferKpCancellationPresentationIntent,
  type KpCancellationOperationId,
  type KpCancellationTeachingGoal
} from "../semantic/cancellation-presentation-authoring.ts";
import type { KpCancellationMeasuredTopology } from "../rendering/cancellation-presentation-capabilities.ts";
import {
  resolveKpCancellationPresentation,
  type KpCancellationPresentationResolution
} from "../rendering/cancellation-presentation-resolver.ts";

export type KpGeneratedCancellationPresentationResult =
  | { readonly kind: "accepted"; readonly resolution: Extract<KpCancellationPresentationResolution, { kind: "resolved" }> }
  | { readonly kind: "repair"; readonly resolution: Exclude<KpCancellationPresentationResolution, { kind: "resolved" }> }
  | { readonly kind: "rejected"; readonly issues: readonly string[] };

const allowedKeys = new Set(["operationId", "teachingGoal", "topology"]);

/** Strict LLM boundary: generated data describes meaning, never rendering. */
export function compileKpGeneratedCancellationPresentation(
  value: unknown
): KpGeneratedCancellationPresentationResult {
  if (!isRecord(value)) return rejected("request must be an object");
  const unknownKeys = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    return rejected(`unsupported generated fields: ${unknownKeys.sort().join(", ")}`);
  }
  const operationId = value["operationId"];
  const teachingGoal = value["teachingGoal"];
  const topology = value["topology"];
  const authorizedOperationId = isOperationId(operationId) ? operationId : undefined;
  const authorizedTeachingGoal = isTeachingGoal(teachingGoal) ? teachingGoal : undefined;
  const measuredTopology = isTopology(topology) ? topology : undefined;
  const issues: string[] = [];
  if (authorizedOperationId === undefined) issues.push("operationId is not an authorized cancellation operation");
  if (authorizedTeachingGoal === undefined) issues.push("teachingGoal is not recognized");
  if (measuredTopology === undefined) issues.push("topology must declare a positive sourceCount and shared or distinct baselines");
  if (
    authorizedOperationId === undefined ||
    authorizedTeachingGoal === undefined ||
    measuredTopology === undefined
  ) return { kind: "rejected", issues: Object.freeze(issues) };

  const resolution = resolveKpCancellationPresentation({
    intent: inferKpCancellationPresentationIntent({
      operationId: authorizedOperationId,
      teachingGoal: authorizedTeachingGoal
    }),
    topology: measuredTopology
  });
  return Object.freeze(resolution.kind === "resolved"
    ? { kind: "accepted", resolution }
    : { kind: "repair", resolution });
}

function rejected(issue: string): KpGeneratedCancellationPresentationResult {
  return Object.freeze({ kind: "rejected", issues: Object.freeze([issue]) });
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOperationId(value: unknown): value is KpCancellationOperationId {
  return value === "kp.algebra.cancel-additive-inverses" ||
    value === "kp.algebra.cancel-multiplicative-inverses";
}

function isTeachingGoal(value: unknown): value is KpCancellationTeachingGoal {
  return value === "preserve-flow" || value === "make-identity-visible";
}

function isTopology(value: unknown): value is KpCancellationMeasuredTopology {
  return isRecord(value) && Number.isInteger(value["sourceCount"]) &&
    Number(value["sourceCount"]) > 0 &&
    (value["sourceBaselines"] === "shared" || value["sourceBaselines"] === "distinct") &&
    Object.keys(value).every((key) => key === "sourceCount" || key === "sourceBaselines");
}
