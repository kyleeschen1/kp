import { projectKpReaderAttention } from "../../reader/runtime/attention-projector.ts";
import type { KpLessonAttentionPlan } from "../../reader/document/public-api.ts";

export function momentumEnergyAttention(id: string): KpLessonAttentionPlan {
  return { kind: "phased-attention-v1", phases: [
    { id: `${id}.orient`, kind: "orient", beatId: `${id}.start`, checkpointId: `${id}.initial`, startProgressPermille: 0, endProgressPermille: 100, cue: "Read the question, then inspect the arrows.", focusRefs: ["physics.particle"] },
    { id: `${id}.act`, kind: "act", beatId: `${id}.end`, checkpointId: `${id}.settled`, startProgressPermille: 100, endProgressPermille: 800, cue: "Follow the momentum arrow while comparing the energy bar.", focusRefs: ["physics.momentum", "physics.energy"] },
    { id: `${id}.settle`, kind: "settle", beatId: `${id}.end`, checkpointId: `${id}.settled`, startProgressPermille: 800, endProgressPermille: 900, cue: "The interval has ended.", focusRefs: ["physics.momentum", "physics.energy"] },
    { id: `${id}.inspect`, kind: "inspect", beatId: `${id}.end`, checkpointId: `${id}.settled`, startProgressPermille: 900, endProgressPermille: 1000, cue: "Compare the result, then continue reading.", focusRefs: ["physics.momentum", "physics.energy"] }
  ] };
}

/** Explicit controls separate reading from motion. The phased projection owns
 * attention; its narrative coordinate is never used as physical seconds. */
export function projectMomentumEnergyAttention(id: string, progress: number) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Invalid attention progress");
  return projectKpReaderAttention({ attention: momentumEnergyAttention(id),
    progressPermille: progress === 0 ? 0 : progress === 1 ? 1000 : 100 + progress * 700 })!;
}
