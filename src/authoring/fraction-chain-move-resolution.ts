import { FractionChainRepair, type FractionChainSource } from "./fraction-chain-source.ts";
import { bindFractionChainAlignment } from "./fraction-chain-alignment.ts";
import { bindFractionChainCombination } from "./fraction-chain-combination.ts";
import { bindFractionChainReduction } from "./fraction-chain-reduction.ts";

type CheckedMove =
  | { readonly kind: "align"; readonly authority: ReturnType<typeof bindFractionChainAlignment> }
  | { readonly kind: "combine"; readonly authority: ReturnType<typeof bindFractionChainCombination> }
  | { readonly kind: "reduce"; readonly authority: ReturnType<typeof bindFractionChainReduction> };

/** Hints select among issued proofs; they cannot authorize an unchecked move.
 * Candidate owners inspect the same frozen endpoints, never proposed geometry. */
export function resolveFractionChainMove(source: FractionChainSource, index: number): CheckedMove {
  const candidates: CheckedMove[] = [];
  const checkers: readonly (() => CheckedMove)[] = [
    () => ({ kind: "align", authority: bindFractionChainAlignment(source, index) }),
    () => ({ kind: "combine", authority: bindFractionChainCombination(source, index) }),
    () => ({ kind: "reduce", authority: bindFractionChainReduction(source, index) })
  ];
  for (const check of checkers) {
    try { candidates.push(check()); }
    catch (error) { if (!(error instanceof FractionChainRepair)) throw error; }
  }
  const hint = source.moves[index]?.hint, path = `$.moves[${index}]`;
  if (!candidates.length) throw new FractionChainRepair("fraction-chain.operation", path,
    "No supported exact adjacent move matches. Supply explicit alignment, raw combination and reduction stops; equivalent endpoints alone do not specify a supported path.");
  if (hint) {
    const selected = candidates.find(candidate => candidate.kind === hint);
    if (selected) return Object.freeze(selected);
    throw new FractionChainRepair("fraction-chain.operation", `${path}.hint`,
      `The hint does not match a checked move. Verified candidates: ${candidates.map(candidate => candidate.kind).join(", ")}.`);
  }
  if (candidates.length !== 1) throw new FractionChainRepair("fraction-chain.operation", `${path}.hint`,
    `Choose a hint among the verified candidates: ${candidates.map(candidate => candidate.kind).join(", ")}.`);
  return Object.freeze(candidates[0]!);
}
