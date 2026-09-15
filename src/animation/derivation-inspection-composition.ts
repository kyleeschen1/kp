import { assertEnergyDerivationPlan, type EnergyDerivationPlan } from "../semantic/momentum-energy-derivation-plan.ts";
import { createKpCausalChainPlan } from "./compressed-causal-chain.ts";

/** A compact inspection reuses proof-issued children, never guessed endpoint
 * diffs. The existing host clock still owns time; these equal-weight segments
 * only partition its normalized algebra interval. */
export function createDerivationInspectionComposition(coarse: EnergyDerivationPlan, fine: EnergyDerivationPlan, index: number) {
  assertEnergyDerivationPlan(coarse); assertEnergyDerivationPlan(fine);
  const parent = coarse.moves[index], refinement = fine.view.refinement;
  if (!parent || !refinement || coarse.model !== fine.model || coarse.namespace !== fine.namespace ||
      refinement.parentTransitionId !== `${coarse.operationPrefix}.${parent.id}`)
    throw new Error("Compound inspection requires the same checked refinement authority");
  const indices = refinement.childOperationIds.map(id => fine.moves.findIndex(move => `${fine.operationPrefix}.${move.id}` === id));
  if (!indices.length || indices.some((child, i) => child < 0 || (i > 0 && child !== indices[i - 1]! + 1)) ||
      fine.view.states[indices[0]!] !== coarse.view.states[index] ||
      fine.view.states[indices.at(-1)! + 1] !== coarse.view.states[index + 1])
    throw new Error("Compound inspection must preserve ordered children and exact outer endpoints");
  const actions = indices.map((child, rank) => ({ id: fine.moves[child]!.id, semanticRank: rank,
    canonicalOperationId: refinement.childOperationIds[rank]!,
    dependsOnActionIds: rank ? [fine.moves[indices[rank - 1]!]!.id] : [],
    fullDurationMs: 1000, minimumVisibleDurationMs: 1000 }));
  const clock = createKpCausalChainPlan({ id: `${refinement.parentTransitionId}.inspection`, presentation: "compressed-context", actions });
  return Object.freeze({ indices: Object.freeze(indices), clock });
}
