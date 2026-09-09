import { isSupportedAuthorTask, supportedAuthorTasks, type SupportedAuthorTask } from "./supported-author-tasks.ts";

type AcceptedOutcome = { readonly status: "compiled" | "compiled-artifact" | "existing-artifact" | "semantic-plan-only" };
type RejectedOutcome = { readonly status: "repair-gap" | "repair-required" };
type OwnerOutcome = AcceptedOutcome | RejectedOutcome;
type ReportBase = {
  readonly kind: "author-check-report";
  readonly task: SupportedAuthorTask;
  readonly authority: "report-only";
  readonly handoff: {
    readonly execution: "not-performed";
    readonly capabilities: (typeof supportedAuthorTasks)[SupportedAuthorTask];
  };
};
export type AuthorCheckReport<T extends OwnerOutcome = OwnerOutcome> = ReportBase & (
  | { readonly status: "checked"; readonly result: T & AcceptedOutcome }
  | { readonly status: "repair-gap"; readonly result: T & RejectedOutcome }
);

export function reportAuthorCheck<T extends OwnerOutcome>(task: SupportedAuthorTask, result: T): AuthorCheckReport<T>;
export function reportAuthorCheck(task: SupportedAuthorTask, result: OwnerOutcome): AuthorCheckReport {
  if (!isSupportedAuthorTask(task)) throw new Error("Unknown author task; select a supported task before checking.");
  const base = { kind: "author-check-report", task, authority: "report-only",
    handoff: Object.freeze({ execution: "not-performed", capabilities: supportedAuthorTasks[task] }) } as const;
  // Preserve the owner's payload verbatim. The wrapper classifies a check; it
  // neither validates serialized proof nor issues host/publication authority.
  switch (result.status) {
    case "compiled":
    case "compiled-artifact":
    case "existing-artifact":
    case "semantic-plan-only":
      return Object.freeze({ ...base, status: "checked", result });
    case "repair-gap":
    case "repair-required":
      return Object.freeze({ ...base, status: "repair-gap", result });
    default:
      return unexpectedOutcome(result);
  }
}

function unexpectedOutcome(value: never): never {
  throw new Error(`Unsupported author check outcome: ${String(value)}`);
}
