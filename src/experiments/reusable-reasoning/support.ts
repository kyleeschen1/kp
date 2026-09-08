import { requireKpReasoningEvidence, type KpReasoningEvidence } from "./evidence.ts";
import { composeKpReasoningProcedure } from "./procedure.ts";
import { bindKpReasoningLocalReferences, pinKpReasoningReference } from "./references.ts";
import { KpReasoningRepairGap } from "./source.ts";

export function bindKpReasoningSupport(evidence: KpReasoningEvidence) {
  requireKpReasoningEvidence(evidence);
  const procedure = composeKpReasoningProcedure(evidence);
  const references = bindKpReasoningLocalReferences(evidence);
  if (procedure.source.id !== references.parentSource.id || procedure.target.id !== references.parentTarget.id) {
    throw new KpReasoningRepairGap("kp.reasoning.parent-conclusion", "$.parent",
      "The child must connect the parent's exact source and target. Revise both the selected range and the declared conclusion.");
  }
  const required = evidence.assumptions.map(item => item.id);
  for (const owner of ["parent", "reason"] as const) {
    const ids = evidence.source[owner].assumptionIds;
    if (ids.length !== required.length || required.some(id => !ids.includes(id))) {
      throw new KpReasoningRepairGap("kp.reasoning.assumption-compatibility", `$.${owner}.assumptionIds`,
        "Retain the explicit real-scalar domain and nonzero-denominator condition; unknown, missing or stronger claims are unsupported.");
    }
    ids.forEach(id => pinKpReasoningReference(evidence, "assumption", id));
  }
  return Object.freeze({
    revisionId: evidence.revisionId,
    parentId: evidence.source.parent.id,
    reasonId: evidence.source.reason.id,
    relation: "same-equation-solutions" as const,
    source: references.parentSource, target: references.parentTarget,
    assumptions: references.assumptions,
    procedure,
    // The verified relation is between exact states. It does not certify the
    // wording, analogy or pedagogical quality of the surrounding explanation.
    editorial: evidence.editorial
  });
}
