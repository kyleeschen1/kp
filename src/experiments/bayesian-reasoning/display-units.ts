import { BinaryJointModel, ProbabilityRepairGap } from "../../../domains/probability/binary-joint-model.ts";
import { createKpRational, type KpNormalizedRational } from "../../../domains/math/exact-rational.ts";

/** One presentation unit for every joint/marginal quantity and its quotient.
 * Preserve the accepted hundred-ticket reading when exact; otherwise use the
 * smallest exact common population, not a product that inflates operands. */
export function createBayesDisplayUnits(model: BinaryJointModel) {
  BinaryJointModel.require(model);
  const unit = model.outcomes.every(outcome => 100n % outcome.mass.denominator === 0n) ? 100n
    : model.outcomes.reduce((unit, outcome) => unit * createKpRational(unit, outcome.mass.denominator).denominator, 1n);
  if (unit > BigInt(Number.MAX_SAFE_INTEGER)) throw new ProbabilityRepairGap("probability.reference", "$.notation",
    "This native arithmetic motif requires an exact safe-integer display population; larger sources remain a presentation repair gap.");
  const count = (mass: KpNormalizedRational) => {
    if (unit % mass.denominator !== 0n) throw new ProbabilityRepairGap("probability.reference", "$.display", "Use a quantity from this joint population.");
    return mass.numerator * (unit / mass.denominator);
  };
  return Object.freeze({ unit, count, label: (mass: KpNormalizedRational) => `${count(mass)}/${unit}` });
}
