import { verifyKpLikeDenominatorCombination, KpLikeDenominatorCombinationError,
  KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY } from "../semantic/fraction-like-denominator-combination.ts";
import { FractionChainRepair, type FractionChainSource } from "./fraction-chain-source.ts";
import { fractionChainAdjacency, fractionChainStateId, fractionChainTerm } from "./fraction-chain-binding.ts";

export function bindFractionChainCombination(chain: FractionChainSource, index: number) {
  const { source, target, path, id } = fractionChainAdjacency(chain, index);
  const from = source.expression, to = target.expression;
  const gap = (message: string): never => { throw new FractionChainRepair("fraction-chain.operation", path, message); };
  if (from.kind !== "pair" || to.kind !== "fraction") return gap("Combine exactly two like-denominator fractions into their raw unreduced result.");
  try {
    return verifyKpLikeDenominatorCombination({ schemaVersion: "kp.like-denominator-combination.v1", id: `transformation.${id}`,
      operationAuthority: KP_LIKE_DENOMINATOR_COMBINATION_OPERATION_AUTHORITY,
      lawAuthority: { id: "law.fraction.combine-like-denominators", authorityRefId: `proof.${id}`, level: "strict" }, operator: from.operator,
      source: { stateId: fractionChainStateId(chain, source), expressionEntityId: `entity.${chain.id}.${source.id}.expression`,
        operatorEntityId: `entity.${chain.id}.${source.id}.operator`,
        terms: [fractionChainTerm(chain, source, "first", from.terms[0]), fractionChainTerm(chain, source, "second", from.terms[1])] },
      target: { stateId: fractionChainStateId(chain, target), expressionEntityId: `entity.${chain.id}.${target.id}.expression`,
        term: fractionChainTerm(chain, target, "result", to.fraction) } });
  } catch (error) {
    if (error instanceof KpLikeDenominatorCombinationError) return gap(`${error.code}: ${error.message}`);
    throw error;
  }
}
