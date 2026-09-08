import { requireBinaryProbabilityTrace, type BinaryProbabilityTrace } from "../../../domains/probability/binary-probability-trace.ts";
import { ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import { createKpConstantQuotientEvaluationAnimationAsset } from "../../animation/operation-evaluation-adapter.ts";
import { compileKpDirectArithmeticEvaluationMigrationV2 } from "../../domain-ir/equation-evaluation-migration-v2.ts";
import { createKpGenericSelectorAnnotatedLatex } from "../../editor/generic-semantic-latex.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";

export function compileBayesNotation(trace: BinaryProbabilityTrace) {
  requireBinaryProbabilityTrace(trace);
  const state = trace.states.find(state => state.kind === "conditioned");
  if (!state || state.kind !== "conditioned") throw new ProbabilityRepairGap("probability.reference", "$.notation", "Resolve a defined conditional query.");
  const { numerator, denominator, value } = state.query;
  // Exact hundredths can be read as a representative population of 100.
  // Other sources use a common exact unit; this is display, not model rescaling.
  const unit = trace.model.outcomes.every(o => 100n % o.mass.denominator === 0n)
    ? 100n : trace.model.outcomes.reduce((d, o) => d * o.mass.denominator, 1n);
  const n = numerator.numerator * (unit / numerator.denominator);
  const d = denominator.numerator * (unit / denominator.denominator);
  if (unit % numerator.denominator !== 0n || unit % denominator.denominator !== 0n ||
      n > BigInt(Number.MAX_SAFE_INTEGER) || d > BigInt(Number.MAX_SAFE_INTEGER))
    throw new ProbabilityRepairGap("probability.reference", "$.notation", "This native arithmetic motif requires exact safe-integer contributors; retain a repair gap for larger inputs.");
  const animation = createKpConstantQuotientEvaluationAnimationAsset({ id: "bayesian-conditional-ratio", numerator: Number(n), denominator: Number(d) });
  const migration = compileKpDirectArithmeticEvaluationMigrationV2(animation);
  const certificate = migration.presentationPlan.transitions[0]?.evaluationFamilyCertificate;
  if (!certificate) throw new ProbabilityRepairGap("probability.reference", "$.notation", "The canonical compiler must issue the existing ink evaluation certificate.");
  return Object.freeze({ animation, certificate, query: state.query, unit,
    numeratorUnits: n, denominatorUnits: d, result: `${value.numerator}/${value.denominator}`,
    mechanism: "canonical-native-katex-contributor-fusion" as const });
}

export function annotateBayesQuotient(state: KpSemanticAssetObject) {
  const value = state.value;
  if (!value || typeof value !== "object" || !("latex" in value) || typeof value.latex !== "string")
    throw new ProbabilityRepairGap("probability.reference", "$.notation", "Resolve an exact native quotient endpoint.");
  return createKpGenericSelectorAnnotatedLatex({ objectId: state.id, latex: value.latex,
    selectors: state.selectors.filter(selector => selector.kind !== "artifact") });
}
