import { compileReasoningDraft } from "./authoring.ts";
import { KpReasoningRepairGap } from "./source.ts";
import { createKpAuthoredDistributionProjection } from "../authoring-structural/distribution-projection.ts";

/** Check one draft without creating a mutable editor session or compiling an
 * unused default lesson first. The same binder still owns all source proof. */
export function checkEquationReasoningSource(json: string) {
  const repair = (code: string, path: string, expected: string) => ({ status: "repair-gap" as const, diagnostic: { code, path, expected } });
  if (json.length > 100_000) return repair("kp.reasoning.draft-size", "$", "Keep the source under 100,000 characters.");
  try {
    const value: unknown = JSON.parse(json);
    const { evidence, prompts } = compileReasoningDraft(value, createKpAuthoredDistributionProjection().projection.animationCandidate);
    return { status: "compiled" as const, domain: "equation" as const, source: evidence.source, revisionId: evidence.revisionId,
      checkpointCount: evidence.source.reason.operationIds.length + 1, promptCount: prompts.length,
      editorialStatus: "editorial" as const };
  } catch (error) {
    if (error instanceof KpReasoningRepairGap) return repair(error.code, error.path, error.expected);
    if (error instanceof SyntaxError) return repair("kp.reasoning.json", "$", "Provide valid JSON before applying the draft.");
    throw error;
  }
}
