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
  | { phase: "orient" | "act" | "settle" | "inspect"; carry: number; algebra: number; callout: true };

// Reversible discovery score for the substitution only. The shared act gate
// still owns algebra; its opening overlaps the tail of whole-scene carry.
const substitutionAttention: KpLessonAttentionPlan = {
  kind: "phased-attention-v1",
  phases: ([ ["orient", 0, 320], ["act", 320, 900], ["settle", 900, 960], ["inspect", 960, 1000] ] as const)
    .map(([kind, start, end]) => ({ id: `energy.substitution.${kind}`, kind, beatId: "energy.move", checkpointId: "energy.destination",
      startProgressPermille: start, endProgressPermille: end, cue: "", focusRefs: [] }))
};

export function sampleSubstitutionPresentation(progress: number): EnergyDerivationPresentation {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new RangeError("Invalid derivation progress");
  const t = Math.max(0, Math.min(1, (progress - .1) / .3));
  const projected = projectKpReaderAttention({ attention: substitutionAttention, progressPermille: progress * 1000 })!;
  return { phase: projected.phaseKind, carry: t * t * (3 - 2 * t), algebra: projected.visualProgressPermille / 1000, callout: true };
}

/** A directional step first finishes/retraces the current edge. Crossing to a
 * neighbor is legal only at the shared endpoint, never from an interior pose. */
export function energyDerivationNavigationTarget(move: number, progress: number, direction: "forward" | "rewind") {
  const total = energyDerivationFocus.length;
  if (!Number.isInteger(move) || move < 0 || move >= total || !Number.isFinite(progress) || progress < 0 || progress > 1)
    throw new RangeError("Invalid derivation navigation position");
  return direction === "forward"
    ? Math.min(total - 1, move + (progress === 1 ? 1 : 0))
    : Math.max(0, move - (progress === 0 ? 1 : 0));
}

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

/** Local discovery envelope: orient before the act gate, retain correspondence
 * through recognition, then reconcile at the dock. Pointer release is irrelevant. */
export function sampleSubstitutionEmphasis(progress: number) {
  sampleSubstitutionPresentation(progress);
  const t = Math.max(0, Math.min(1, progress / .2, (1 - progress) / .1));
  return { ...energyDerivationFocus[0], strength: t * t * (3 - 2 * t) };
}

/** An integer denotes the completed equation, not the next move's opening
 * frame. This makes checkpoint jumps and reverse agree at shared boundaries. */
export function resolveEnergyDerivationPosition(position: number) {
  const total = energyDerivationFocus.length;
  if (!Number.isFinite(position) || position < 0 || position > total) throw new RangeError("Invalid derivation position");
  const move = Math.max(0, Math.ceil(position) - 1);
  return { move, progress: position - move };
}

/** Spatial control owns carry; the existing attention gate still owns algebra.
 * Both sample the same position, so reversing cannot choose a different motif. */
export function sampleEnergyDerivationLens(progress: number): EnergyDerivationPresentation {
  const frame = sampleSubstitutionPresentation(progress);
  return { ...frame, carry: progress };
}

/** Small endpoint plateaus make complete lines easy to hold without snapping
 * an arbitrary intermediate release. The mapping is continuous and reversible. */
export function resolveEnergyDerivationLensPosition(position: number) {
  if (!Number.isFinite(position)) throw new RangeError("Invalid lens position");
  const bounded = Math.max(0, Math.min(energyDerivationFocus.length, position));
  const line = Math.floor(bounded), fraction = bounded - line;
  const restingZone = .055;
  return line + Math.max(0, Math.min(1, (fraction - restingZone) / (1 - 2 * restingZone)));
}

/** Equation positions are measured by the host. Prose may enlarge one interval
 * without changing its semantic endpoints or the duration of explicit playback. */
export function resolveEnergyDerivationMeasuredPosition(y: number, centers: readonly number[]) {
  if (!Number.isFinite(y) || centers.length !== energyDerivationFocus.length + 1 ||
      centers.some((value, i) => !Number.isFinite(value) || (i > 0 && value <= centers[i - 1]!)))
    throw new RangeError("Invalid derivation geometry");
  if (y <= centers[0]!) return 0;
  for (let i = 0; i < centers.length - 1; i++) {
    if (y <= centers[i + 1]!) return resolveEnergyDerivationLensPosition(i + (y - centers[i]!) / (centers[i + 1]! - centers[i]!));
  }
  return centers.length - 1;
}

type DerivationRecordInspection =
  | { kind: "docked"; endpoint: "source" | "target"; inspectionOpacity: 0; sourceEmphasis: number; targetEmphasis: number }
  | { kind: "inspection"; inspectionOpacity: number; sourceEmphasis: number; targetEmphasis: number };

/** The document record is never withdrawn. Only its explanatory inspection
 * copy yields at a dock; this is not a mathematical split/merge operation. */
export function sampleDerivationRecordInspection(progress: number, distance: number, equationHeight: number): DerivationRecordInspection {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1 || !Number.isFinite(distance) || distance <= 0 || !Number.isFinite(equationHeight) || equationHeight <= 0)
    throw new RangeError("Invalid record inspection geometry");
  if (progress === 0 || progress === 1) return { kind: "docked", endpoint: progress === 0 ? "source" : "target", inspectionOpacity: 0, sourceEmphasis: 1 - progress, targetEmphasis: progress };
  const t = Math.min(1, Math.min(progress, 1 - progress) * distance / (equationHeight * .35));
  const opacity = t * t * (3 - 2 * t);
  return { kind: "inspection", inspectionOpacity: opacity, sourceEmphasis: progress < .5 ? 1 - opacity : 0, targetEmphasis: progress > .5 ? 1 - opacity : 0 };
}
