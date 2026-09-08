import { requireKpReasoningEvidence, type KpReasoningEvidence } from "./evidence.ts";
import { pinKpReasoningReference } from "./references.ts";
import { KpReasoningRepairGap } from "./source.ts";

/** Expose an already verified substitution; never infer a rewrite from LaTeX. */
export function bindKpReasoningFormula(evidence: KpReasoningEvidence) {
  requireKpReasoningEvidence(evidence);
  const { formula } = evidence.source;
  const { source, verification, normalFormPlan } = evidence.distribution;
  if (formula.lawId !== verification.lawId) throw new KpReasoningRepairGap(
    "kp.reasoning.formula-law", "$.formula.lawId", "Select the verified kp.algebra.distribute.v1 law.");
  if (formula.commonFactorId !== verification.commonFactorId) throw new KpReasoningRepairGap(
    "kp.reasoning.formula-factor", "$.formula.commonFactorId", "Bind the verified common factor, not a matching glyph or copied term.");
  const root = source.root;
  if (root.kind !== "product" || root.factors.length !== 2
    || root.factors[0]!.id !== verification.commonFactorId || root.factors[1]!.kind !== "sum") {
    throw new KpReasoningRepairGap("kp.reasoning.formula-source", "$.formula",
      "This application requires the existing scalar product-of-two-addends authority.");
  }
  const factor = root.factors[0]!;
  const sum = root.factors[1]!;
  if (sum.terms.length !== 2 || formula.addendIds.some((id, index) => id !== sum.terms[index]!.id)) {
    throw new KpReasoningRepairGap("kp.reasoning.formula-addends", "$.formula.addendIds",
      "Bind both source addends in verified order; this is not a commutation or an omitted-term rewrite.");
  }
  return Object.freeze({
    revisionId: evidence.revisionId, lawId: verification.lawId,
    notation: "a(b+c)=ab+ac",
    bindings: Object.freeze([
      Object.freeze({ role: "a" as const, entityId: factor.id, expression: factor }),
      Object.freeze({ role: "b" as const, entityId: sum.terms[0]!.id, expression: sum.terms[0]! }),
      Object.freeze({ role: "c" as const, entityId: sum.terms[1]!.id, expression: sum.terms[1]! })
    ]),
    sourceRootId: verification.sourceRootId, targetRootId: verification.targetRootId,
    lineage: normalFormPlan.lineage,
    assumptions: Object.freeze(evidence.assumptions.map(item => pinKpReasoningReference(evidence, "assumption", item.id)))
  });
}
