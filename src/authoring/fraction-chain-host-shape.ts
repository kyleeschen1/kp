import { assertCheckedFractionChain, type CheckedFractionChain } from "./fraction-chain-checked.ts";
import { FractionChainRepair } from "./fraction-chain-source.ts";

export function assertFractionChainHostShape(chain: CheckedFractionChain): void {
  assertCheckedFractionChain(chain);
  const [alignment, combination, reduction] = chain.steps;
  if (alignment?.kind !== "align" || combination?.kind !== "combine" ||
      (chain.steps.length !== 2 && (chain.steps.length !== 3 || reduction?.kind !== "reduce")))
    throw new FractionChainRepair("fraction-chain.presentation", "$.moves",
      "The fraction passage requires alignment then raw addition/subtraction, optionally followed by one reduction. Other checked sequences need a different host.");
}
