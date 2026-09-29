import type { KpSymbolicInspectionEvidence } from "./symbolic-inspection-types.ts";

/** A display summary cannot authorize execution or upgrade a declared law. */
export function describeKpSymbolicInspectionValidity(evidence: KpSymbolicInspectionEvidence) {
  const unresolved = evidence.checks.flatMap(check => check.status === "unknown" ? [check.statement] : []);
  const laws = evidence.checks.flatMap(check => check.status === "declared" ? [check.law.id] : []);
  return Object.freeze({
    status: unresolved.length ? "conditions-unchecked" as const : "references-checked" as const,
    summary: "Object references, endpoint membership and correspondence shapes checked.",
    limitation: "These checks do not prove mathematical equivalence. Named laws are declarations; assumptions below are not independently verified by this inspector.",
    assumptions: Object.freeze(unresolved),
    lawIds: Object.freeze(laws)
  });
}
