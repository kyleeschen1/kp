import type { KpSymbolicInspectionCheck, KpSymbolicInspectionEvidence } from "../../src/semantic/symbolic-inspection-types.ts";

const declared: KpSymbolicInspectionCheck = { status: "declared", scope: "law", law: { id: "distributivity", level: "strict" } };
// A named law and its desired strictness are not an executed proof.
// @ts-expect-error checked law evidence is not supplied by this projection.
const fabricated: KpSymbolicInspectionCheck = { status: "checked", scope: "law", law: declared.law };
// @ts-expect-error unknown assumptions cannot become checked evidence by changing a label.
const assumed: KpSymbolicInspectionCheck = { status: "checked", scope: "assumption", statement: "x is nonzero" };
function cannotMutate(evidence: KpSymbolicInspectionEvidence) {
  // @ts-expect-error inspection cannot rewrite the operation's source.
  evidence.sourceObjectIds.push("other");
  // @ts-expect-error there is no execution authority in read-only evidence.
  evidence.apply();
}
void fabricated; void assumed; void cannotMutate;
