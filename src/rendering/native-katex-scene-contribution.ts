import type { KpEquationMaterialLayerOwnerFrame } from "./equation-material-layer-types.ts";
import type { KpEquationProtectedTransitFrame } from "./equation-motion-path-planner.ts";

export type KpNativeKatexMaterialSampler =
  (progress: number) => readonly KpEquationMaterialLayerOwnerFrame[];

/** Composition owns ordering; an operation sampler does not nest another owner. */
export function composeKpNativeKatexMaterialSamplers(
  samplers: readonly KpNativeKatexMaterialSampler[]
): KpNativeKatexMaterialSampler {
  const participants = [...samplers];
  return progress => {
    if (!Number.isFinite(progress)) throw new Error("Material progress must be finite.");
    const bounded = Math.max(0, Math.min(1, progress));
    return Object.freeze(participants.flatMap(sample => sample(bounded)));
  };
}

/** Occupancy follows transformed measured ink, never a layout-box fallback. */
export function projectKpNativeKatexMaterialOccupancy(
  owners: readonly KpEquationMaterialLayerOwnerFrame[],
  componentId: string
): readonly KpEquationProtectedTransitFrame[] {
  return owners.map(owner => {
    const rect = owner.expectedPaintRect;
    if (rect === undefined) throw new Error(`Missing measured material paint: ${owner.ownerId}.`);
    return { trackId: owner.ownerId, componentId, rect, opacity: owner.opacity };
  });
}
