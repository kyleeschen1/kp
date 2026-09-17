import type { KpExactFractionTermDraft } from "../semantic/exact-fraction-expression.ts";
import { FractionChainRepair, type FractionChainFraction, type FractionChainSource, type FractionChainState } from "./fraction-chain-source.ts";

export function fractionChainAdjacency(chain: FractionChainSource, index: number) {
  const move = chain.moves[index], source = chain.states[index], target = chain.states[index + 1];
  if (!Number.isInteger(index) || !move || !source || !target || move.from !== source.id || move.to !== target.id)
    throw new FractionChainRepair("fraction-chain.operation", `$.moves[${index}]`, "Use a declared consecutive state pair.");
  return { move, source, target, path: `$.moves[${index}]`, id: `${chain.id}.${move.id}` };
}
export function fractionChainStateId(chain: FractionChainSource, state: FractionChainState) {
  return `state.${chain.id}.${state.id}`;
}
/** State-local occurrences are shared by adjacent operation bindings. Equal
 * numbers in different positions never acquire the same occurrence identity. */
export function fractionChainTerm(chain: FractionChainSource, state: FractionChainState, position: "first" | "second" | "result", value: FractionChainFraction): KpExactFractionTermDraft {
  const entity = `entity.${chain.id}.${state.id}.${position}`, semantic = `semantic.${chain.id}.${position}`;
  return { termEntityId: `${entity}.term`, fractionEntityId: `${entity}.fraction`, divisionEntityId: `${entity}.division`,
    numerator: { entityId: `${entity}.numerator`, semanticId: `${semantic}.numerator`, value: value.numerator },
    denominator: { entityId: `${entity}.denominator`, semanticId: `${semantic}.denominator`, value: value.denominator } };
}
