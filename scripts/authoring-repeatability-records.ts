import type { AuthorCheckReport } from "../src/authoring/author-check-report.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";
import type { RepeatabilityCase } from "./authoring-repeatability-cases.ts";

export type TrialPreview =
  | { readonly status: "not-performed" }
  | { readonly status: "reference-only"; readonly url: string; readonly visited: false }
  | { readonly status: "unsupported"; readonly reason: string }
  | { readonly status: "applied"; readonly sourceSha256: string; readonly revision: string;
      readonly host: string; readonly mode: "existing-host-fixture" | "existing-host-editor";
      readonly command: string; readonly checks: readonly string[] }
  | { readonly status: "failed"; readonly sourceApplied: true; readonly sourceSha256: string; readonly revision: string;
      readonly host: string; readonly mode: "existing-host-fixture" | "existing-host-editor";
      readonly command: string; readonly checks: readonly string[]; readonly failures: readonly string[] };

export interface TrialWork {
  readonly sourceEditsAfterFreeze: number;
  readonly adapterEdits: number;
  readonly engineEdits: number;
  readonly editorialCorrections: readonly string[];
  readonly engineeringMinutes: number | null;
  readonly notes: string;
}

export function createTrialRecord(item: RepeatabilityCase, report: AuthorCheckReport,
  checkElapsedMs: number, work: TrialWork, preview?: TrialPreview) {
  if (report.task !== item.task || report.authority !== "report-only" || report.handoff.execution !== "not-performed")
    throw new Error("Trial report must come from the selected existing owner without applied authority.");
  if (!Number.isFinite(checkElapsedMs) || checkElapsedMs < 0) throw new Error("Invalid measured check duration.");
  for (const count of [work.sourceEditsAfterFreeze, work.adapterEdits, work.engineEdits])
    if (!Number.isSafeInteger(count) || count < 0) throw new Error("Edit counts must be nonnegative integers.");
  if (work.sourceEditsAfterFreeze !== 0) throw new Error("Frozen trial inputs cannot be corrected in place.");
  if (work.engineeringMinutes !== null && (!Number.isFinite(work.engineeringMinutes) || work.engineeringMinutes < 0))
    throw new Error("Engineering time must be measured or explicitly unknown.");
  if (!work.notes.trim() || work.editorialCorrections.some(note => !note.trim())) throw new Error("Retain qualified work evidence.");
  const capability = supportedAuthorTasks[item.task].preview;
  const application: TrialPreview = preview ?? (report.status === "repair-gap"
    ? { status: "unsupported", reason: "Existing owner returned a repair; retain its exact diagnostic below." }
    : capability.kind === "reference-only"
      ? { status: "reference-only", url: capability.url, visited: false }
      : { status: "not-performed" });
  // A capability declaration is not evidence that these bytes reached a host.
  if (report.status === "repair-gap" && application.status !== "unsupported" && application.status !== "not-performed")
    throw new Error("Rejected input cannot claim reference or application evidence.");
  if (application.status === "applied" || application.status === "failed") {
    if (report.status !== "checked" || (capability.kind !== "explicit-apply" && capability.kind !== "local-source-build"))
      throw new Error("Rejected or reference-only input cannot be an applied success.");
    if (application.sourceSha256 !== item.sha256 || !application.revision.trim()
      || !application.host.startsWith("/experiments/") || !application.command.trim()
      || !application.checks.length || application.checks.some(check => !check.trim()))
      throw new Error("Applied evidence must pin the frozen bytes, revision, host and executed checks.");
    if (!("revisionId" in report.result) || application.revision !== report.result.revisionId)
      throw new Error("Applied revision must match the current owner report.");
    if ((capability.kind === "explicit-apply") !== (application.mode === "existing-host-editor"))
      throw new Error("Application evidence must use the declared host mechanism.");
    if (application.status === "failed" && (!application.failures.length || application.failures.some(failure => !failure.trim())))
      throw new Error("Failed preview must retain its preservation gap.");
    if (item.task === "equation.fraction-chain") {
      const result = report.result;
      if (!("hostEligibility" in result) || !isRecord(result.hostEligibility) || result.hostEligibility["status"] !== "eligible")
        throw new Error("Fraction application requires the current owner's explicit host eligibility.");
    }
  }
  if (application.status === "reference-only" && (capability.kind !== "reference-only" || application.url !== capability.url))
    throw new Error("Reference claims must use the selected task's declared host.");
  return {
    schema: "kp.authoring-repeatability-result.v1" as const,
    caseId: item.id, task: item.task, inputSha256: item.sha256,
    expected: item.expected, actual: report.status, expectationMatched: item.expected === report.status,
    report, preview: application, checkElapsedMs, work,
    editorialJudgment: "not-certified" as const,
    provenance: "current-agent-with-implementation-knowledge" as const
  };
}

export function createFailedTrialRecord(item: RepeatabilityCase, error: unknown) {
  return { schema: "kp.authoring-repeatability-failure.v1" as const, caseId: item.id, task: item.task,
    inputSha256: item.sha256, actual: "failed" as const, expectationMatched: false as const,
    preview: { status: "not-performed" as const },
    error: error instanceof Error ? error.message : String(error) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
