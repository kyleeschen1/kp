import { bindCodeReasoningEvidence, KpCodeReasoningRepairGap } from "./code-evidence.ts";

/** Language-owned checking: seven pedagogical stages are not seven separately
 * verified programs, and declared behavior cases are not arbitrary-code proof. */
export function checkCodeReasoningSource(json: string) {
  const repair = (code: string, path: string, expected: string) => ({ status: "repair-gap" as const, diagnostic: { code, path, expected } });
  if (json.length > 100_000) return repair("kp.reasoning.draft-size", "$", "Keep the source under 100,000 characters.");
  try {
    const evidence = bindCodeReasoningEvidence(JSON.parse(json));
    return { status: "compiled" as const, domain: "code" as const, source: evidence.source, revisionId: evidence.revisionId,
      checkpointCount: evidence.context.steps.length, checkpointKind: evidence.context.checkpointKind,
      assumptions: evidence.context.assumptions, editorialStatus: evidence.context.editorialStatus };
  } catch (error) {
    if (error instanceof KpCodeReasoningRepairGap) return repair(error.code, error.path, error.expected);
    if (error instanceof SyntaxError) return repair("kp.reasoning.json", "$", "Provide valid JSON.");
    throw error;
  }
}
