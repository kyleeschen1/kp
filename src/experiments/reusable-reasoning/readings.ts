import type { KpReasoningEvidence } from "./evidence.ts";
import { freezeKpReasoningOwnedProjection } from "./evidence.ts";
import { extractKpReasoningContext } from "./extraction.ts";

export type ReasoningReading = "full" | "compact";

export function projectReasoningReading(evidence: KpReasoningEvidence, mode: ReasoningReading) {
  const context = extractKpReasoningContext(evidence);
  // Compression changes editorial density, never the claim or its conditions.
  const result = { mode, revisionId: evidence.revisionId,
    text: mode === "compact" ? evidence.source.compact : evidence.source.reason.explanation,
    editorialStatus: "editorial" as const, claims: context.claimReferences,
    assumptions: context.assumptions, source: context.parent.source, target: context.parent.target,
    operations: context.operations, definitions: context.definitions };
  freezeKpReasoningOwnedProjection(result);
  return result;
}
