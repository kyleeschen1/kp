import { sampleMomentumEnergy, physicalTime, type CheckedMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { projectKpReaderAttention } from "../../reader/runtime/attention-projector.ts";
import type { KpLessonAttentionPlan } from "../../reader/document/public-api.ts";
import { compileKpCrossViewAttentionPlan } from "../cross-view-attention.ts";
import { validateKpCrossViewCorrespondenceMap, type KpCrossViewCorrespondenceMap } from "../cross-view-correspondence.ts";

export const momentumMoveParts = ["direction", "magnitude", "energy"] as const;
export const momentumMoveMap: KpCrossViewCorrespondenceMap = {
  id: "momentum.move",
  members: momentumMoveParts.flatMap(part => ["text", "evidence"].map(view => ({
    id: `${part}.${view}`, viewId: view, selectorId: `momentum.move.${part}.${view}`, role: part
  }))), identities: [],
  correspondences: momentumMoveParts.map(part => ({ id: part, sourceMemberId: `${part}.text`,
    targetMemberId: `${part}.evidence`, kind: "evidence-to-claim", reversible: true,
    summary: `Inspect the ${part} step of the constant-energy inference.` }))
};
const issues = validateKpCrossViewCorrespondenceMap(momentumMoveMap);
if (issues.length) throw new Error(issues[0]!.message);
const attention: KpLessonAttentionPlan = { kind: "phased-attention-v1", phases: [
  { id: "momentum.move.orient", kind: "orient", beatId: "direction", checkpointId: "initial", startProgressPermille: 0, endProgressPermille: 100, cue: "Read the direction change.", focusRefs: ["direction"] },
  { id: "momentum.move.act", kind: "act", beatId: "direction", checkpointId: "turned", startProgressPermille: 100, endProgressPermille: 550, cue: "Follow the changing direction.", focusRefs: ["direction"] },
  { id: "momentum.move.settle", kind: "settle", beatId: "magnitude", checkpointId: "turned", startProgressPermille: 550, endProgressPermille: 800, cue: "Its length stays the same.", focusRefs: ["magnitude"] },
  { id: "momentum.move.inspect", kind: "inspect", beatId: "energy", checkpointId: "conclusion", startProgressPermille: 800, endProgressPermille: 1000, cue: "Therefore its kinetic energy stays the same.", focusRefs: ["energy"] }
] };

/** Narrative progress owns attention; only the act phase advances physical time.
 * Later clauses inspect the invariant and its consequence at the same endpoint. */
export function projectMomentumMove(model: CheckedMomentumEnergy, progress: number) {
  if (model.source.episode !== "turning" || model.source.massKg !== 1)
    throw new Error("physics.momentum-move.source: use the checked unit-mass turn");
  const projected = projectKpReaderAttention({ attention, progressPermille: progress * 1000 })!;
  const part = momentumMoveParts.find(part => part === projected.beatId)!;
  const plan = compileKpCrossViewAttentionPlan({ id: "momentum.move.attention", map: momentumMoveMap, correspondenceIds: [part] });
  const focused = new Set(plan.salience.intents.flatMap(intent => intent.kind === "transmit" ? [...intent.sourceEntityIds, ...intent.targetEntityIds] : []));
  return { attention: projected, part,
    frame: sampleMomentumEnergy(model, physicalTime(projected.visualProgressPermille / 1000 * model.durationSeconds)),
    entities: momentumMoveMap.members.map(member => ({ id: member.selectorId, salience: focused.has(member.selectorId) ? "focus" : "context" })) };
}

export function momentumMoveArrow(x: number, y: number) {
  const endX = 100 + 65 * x, endY = 100 - 65 * y;
  const angle = Math.atan2(endY - 100, endX - 100);
  const wing = (offset: number) => `${endX - 8 * Math.cos(angle + offset)} ${endY - 8 * Math.sin(angle + offset)}`;
  return `M100 100 L${endX} ${endY} M${wing(.45)} L${endX} ${endY} L${wing(-.45)}`;
}
