import { projectKpReaderAttention } from "../../reader/runtime/attention-projector.ts";
import type { KpLessonAttentionPlan } from "../../reader/document/public-api.ts";

// Candidate score for this proof history, not new mathematical transformations.
// Carrying relocates the native scene intact; only the shared act gate may
// advance the underlying algebra. Direct seek and rewind use the same sample.
const attention: KpLessonAttentionPlan = {
  kind: "phased-attention-v1",
  phases: ([ ["orient", 0, 300], ["act", 300, 870], ["settle", 870, 950], ["inspect", 950, 1000] ] as const)
    .map(([kind, start, end]) => ({ id: `energy.${kind}`, kind, beatId: "energy.move", checkpointId: "energy.destination",
      startProgressPermille: start, endProgressPermille: end, cue: "", focusRefs: [] }))
};
export type EnergyDerivationPresentation =
  | { phase: "carry"; carry: number; algebra: 0; callout: false }
  | { phase: "orient" | "act" | "settle" | "inspect"; carry: 1; algebra: number; callout: true };

export function sampleEnergyDerivationPresentation(progress: number): EnergyDerivationPresentation {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new RangeError("Invalid derivation progress");
  if (progress < .18) {
    const t = progress / .18;
    return { phase: "carry", carry: t * t * (3 - 2 * t), algebra: 0, callout: false };
  }
  const projected = projectKpReaderAttention({ attention, progressPermille: Math.min(1000, (progress - .18) / .82 * 1000) })!;
  return { phase: projected.phaseKind, carry: 1, algebra: projected.visualProgressPermille / 1000, callout: true };
}

// Stable selector roles already declared by the checked derivation. Geometry
// comes from their native wrappers, never from matching glyph strings.
export const energyDerivationFocus = [
  { source: "energy.substitute.0.velocity", target: "energy.substitute.1.replacement" },
  { source: "energy.scale-magnitude.0.power", target: "energy.scale-magnitude.1.power-bottom" },
  { source: "energy.cancel-mass.0.scalar-before", target: "energy.cancel-mass.1.scalar-after" }
] as const;

/** An integer denotes the completed equation, not the next move's opening
 * frame. This makes checkpoint jumps and reverse agree at shared boundaries. */
export function resolveEnergyDerivationPosition(position: number) {
  const total = energyDerivationFocus.length;
  if (!Number.isFinite(position) || position < 0 || position > total) throw new RangeError("Invalid derivation position");
  const move = Math.max(0, Math.ceil(position) - 1);
  return { move, progress: position - move };
}
