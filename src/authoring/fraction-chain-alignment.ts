import { verifyKpCommonDenominatorAlignment, KpCommonDenominatorSemanticError,
  KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY } from "../semantic/fraction-common-denominator.ts";
import { FractionChainRepair, type FractionChainSource } from "./fraction-chain-source.ts";
import { fractionChainAdjacency, fractionChainStateId, fractionChainTerm } from "./fraction-chain-binding.ts";

export function bindFractionChainAlignment(chain: FractionChainSource, index: number) {
  const { source, target, path, id } = fractionChainAdjacency(chain, index);
  const from = source.expression, to = target.expression;
  const gap = (message: string): never => { throw new FractionChainRepair("fraction-chain.operation", path, message); };
  if (from.kind !== "pair" || to.kind !== "pair" || from.operator !== to.operator)
    return gap("Alignment currently requires two ordered fractions with the same operator on both sides.");
  const factor = (position: 0 | 1) => {
    const before = from.terms[position].denominator, after = to.terms[position].denominator;
    if (before <= 0n || after < before || after % before !== 0n) return gap("Each target denominator must be a positive integer multiple of its source denominator.");
    const value = after / before;
    return { entityId: `entity.${id}.scale.${position}`, semanticId: `semantic.${id}.scale.${position}`, numerator: value, denominator: value };
  };
  const left = factor(0), right = factor(1);
  if (left.numerator === 1n && right.numerator === 1n) return gap("Alignment must change at least one fraction's scale.");
  try {
    return verifyKpCommonDenominatorAlignment({ schemaVersion: "kp.common-denominator-alignment.v1", operator: from.operator, id: `transformation.${id}`,
      operationAuthority: KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY,
      lawAuthority: { id: "law.fraction.equivalent-common-denominator", authorityRefId: `proof.${id}`, level: "strict" },
      source: { stateId: fractionChainStateId(chain, source), expressionEntityId: `entity.${chain.id}.${source.id}.expression`,
        operatorEntityId: `entity.${chain.id}.${source.id}.operator`,
        terms: [fractionChainTerm(chain, source, "first", from.terms[0]), fractionChainTerm(chain, source, "second", from.terms[1])] },
      target: { stateId: fractionChainStateId(chain, target), expressionEntityId: `entity.${chain.id}.${target.id}.expression`,
        operatorEntityId: `entity.${chain.id}.${target.id}.operator`,
        terms: [fractionChainTerm(chain, target, "first", to.terms[0]), fractionChainTerm(chain, target, "second", to.terms[1])] },
      equivalenceMultipliers: [left, right] });
  } catch (error) {
    if (error instanceof KpCommonDenominatorSemanticError) return gap(`${error.code}: ${error.message}`);
    throw error;
  }
}
