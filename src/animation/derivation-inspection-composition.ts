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

/** Row correspondence is semantic, not a ratio of two differently sized rails.
 * Interior correspondence is licensed only by the identical issued children. */
export function createDerivationRefinementMapping(coarse: EnergyDerivationPlan, fine: EnergyDerivationPlan) {
  assertEnergyDerivationPlan(coarse); assertEnergyDerivationPlan(fine);
  const parent = coarse.moves.findIndex(move => `${coarse.operationPrefix}.${move.id}` === fine.view.refinement?.parentTransitionId);
  const composition = createDerivationInspectionComposition(coarse, fine, parent);
  const count = composition.indices.length, shift = count - 1;
  const rows = coarse.view.states.map((state, index) => {
    const expanded = index <= parent ? index : index + shift;
    if (fine.view.states[expanded] !== state) throw new Error("Refinement changed a surrounding state");
    return Object.freeze({ coarse: index, fine: expanded });
  });
  if (fine.moves.length !== coarse.moves.length + shift || composition.indices[0] !== parent ||
      coarse.moves.some((move, index) => index !== parent &&
        fine.moves[index < parent ? index : index + shift]?.id !== move.id))
    throw new Error("Refinement must retain surrounding move identities");
  const child = coarse.inspections?.[coarse.moves[parent]!.id];
  const sharedChildren = child !== undefined && composition.indices.every((index, rank) => fine.moves[index] === child.moves[rank]);
  return Object.freeze({ parent, rows: Object.freeze(rows),
    mapAlgebra(progress: number) {
      if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new RangeError("Invalid algebra position");
      if (!sharedChildren && progress !== 0 && progress !== 1) return undefined;
      const time = progress * composition.clock.totalDurationMs;
      const rank = Math.min(count - 1, composition.clock.segments.findIndex(segment => time < segment.endMs));
      const selected = rank < 0 ? count - 1 : rank;
      const segment = composition.clock.segments[selected]!;
      return Object.freeze({ transition: fine.moves[composition.indices[selected]!]!.id,
        progress: (time - segment.startMs) / segment.durationMs });
    }
  });
}
