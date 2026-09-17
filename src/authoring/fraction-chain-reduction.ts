import { verifyIntegerFractionReduction, IntegerFractionReductionError } from "../semantic/fraction-integer-reduction.ts";
import { FractionChainRepair, type FractionChainSource } from "./fraction-chain-source.ts";
import { fractionChainAdjacency, fractionChainStateId, fractionChainTerm } from "./fraction-chain-binding.ts";

export function bindFractionChainReduction(chain: FractionChainSource, index: number) {
  const { source, target, path, id } = fractionChainAdjacency(chain, index);
  const from = source.expression, to = target.expression;
  const gap = (message: string): never => { throw new FractionChainRepair("fraction-chain.operation", path, message); };
  if (from.kind !== "fraction" || to.kind !== "fraction") return gap("Reduction needs a single fraction at each endpoint.");
  if (to.fraction.denominator <= 0n || from.fraction.denominator % to.fraction.denominator !== 0n)
    return gap("The target denominator must divide the source denominator exactly.");
  try {
    return verifyIntegerFractionReduction({ id: `transformation.${id}`,
      source: { stateId: fractionChainStateId(chain, source), term: fractionChainTerm(chain, source, "result", from.fraction) },
      target: { stateId: fractionChainStateId(chain, target), term: fractionChainTerm(chain, target, "result", to.fraction) },
      divisor: from.fraction.denominator / to.fraction.denominator });
  } catch (error) {
    if (error instanceof IntegerFractionReductionError) return gap(error.message);
    throw error;
  }
}
