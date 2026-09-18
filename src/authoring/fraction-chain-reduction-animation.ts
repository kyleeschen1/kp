import { assertCheckedFractionChain, type CheckedFractionChain } from "./fraction-chain-checked.ts";
import { FractionChainRepair } from "./fraction-chain-source.ts";
import { createFractionSimplificationAnimationAsset } from "../animation/fraction-adapter.ts";

export function createCheckedFractionReductionAnimation(chain: CheckedFractionChain, index: number) {
  assertCheckedFractionChain(chain);
  const step = chain.steps[index], path = `$.moves[${index}]`;
  if (step?.kind !== "reduce") throw new FractionChainRepair("fraction-chain.presentation", path, "Select a checked fraction reduction.");
  const authority = step.authority;
  if (authority.source.term.numerator.value <= 0n || authority.target.term.numerator.value <= 0n)
    throw new FractionChainRepair("fraction-chain.presentation", path, "The current reduction presentation requires positive numerators; exact signed/zero reduction is not yet a supported visual caller.");
  try {
    return createFractionSimplificationAnimationAsset({ familyId: "generated.fraction-expression", id: `generated.fraction-expression.${chain.source.id}.${chain.source.moves[index]!.id}`,
      title: chain.source.moves[index]!.prose, numerator: Number(authority.source.term.numerator.value), denominator: Number(authority.source.term.denominator.value),
      simplifiedNumerator: Number(authority.target.term.numerator.value), simplifiedDenominator: Number(authority.target.term.denominator.value) });
  } catch (error) {
    throw new FractionChainRepair("fraction-chain.presentation", path, error instanceof Error ? error.message : "Reduction construction failed.");
  }
}
