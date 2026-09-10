import type { KpEquationMaterialLayerOwnerFrame } from "./equation-material-layer-types.ts";
import type { KpEquationProtectedTransitFrame } from "./equation-motion-path-planner.ts";

export type KpNativeKatexMaterialSampler =
  (progress: number) => readonly KpEquationMaterialLayerOwnerFrame[];

export interface KpNativeKatexMeasuredMaterialFrame extends KpEquationMaterialLayerOwnerFrame {
  readonly expectedPaintRect: NonNullable<KpEquationMaterialLayerOwnerFrame["expectedPaintRect"]>;
}

const contributionAuthority: unique symbol = Symbol("native-katex-scene-contribution");
export interface KpNativeKatexSceneContribution {
  readonly [contributionAuthority]: true;
  readonly id: string;
  readonly sample: (progress: number) => {
    readonly owners: readonly KpNativeKatexMeasuredMaterialFrame[];
    readonly occupancy: readonly KpEquationProtectedTransitFrame[];
  };
}

const liveContributions = new WeakSet<KpNativeKatexSceneContribution>();

/** Narrow legacy frame producers at the measured-paint boundary, without a cast. */
export function requireKpNativeKatexMeasuredMaterialFrame(
  owner: KpEquationMaterialLayerOwnerFrame
): KpNativeKatexMeasuredMaterialFrame {
  const rect = owner.expectedPaintRect;
  if (!rect || ![rect.left, rect.top, rect.width, rect.height, owner.opacity].every(Number.isFinite) ||
      rect.width < 0 || rect.height < 0 || owner.opacity < 0 || owner.opacity > 1) {
    throw new Error(`Invalid measured material paint: ${owner.ownerId}.`);
  }
  return Object.freeze({ ...owner, rect: Object.freeze({ ...owner.rect }),
    expectedPaintRect: Object.freeze({ ...rect }) });
}

export function createKpNativeKatexSceneContribution(input: {
  readonly id: string;
  readonly sample: (progress: number) => readonly KpNativeKatexMeasuredMaterialFrame[];
}): KpNativeKatexSceneContribution {
  if (!input.id.trim()) throw new Error("A material contribution requires an identity.");
  const { id, sample } = input;
  // Only this issuer couples occupancy to actual paint; callers cannot supply
  // a second, conveniently incomplete occupancy sampler.
  const contribution = Object.freeze({
    [contributionAuthority]: true as const,
    id,
    sample(progress: number) {
      if (!Number.isFinite(progress)) throw new Error("Material progress must be finite.");
      const owners = Object.freeze(sample(Math.max(0, Math.min(1, progress)))
        .map(requireKpNativeKatexMeasuredMaterialFrame));
      return Object.freeze({ owners,
        occupancy: Object.freeze(projectKpNativeKatexMaterialOccupancy(owners, id)) });
    }
  });
  liveContributions.add(contribution);
  return contribution;
}

export function isKpNativeKatexSceneContribution(value: unknown): value is KpNativeKatexSceneContribution {
  return typeof value === "object" && value !== null &&
    liveContributions.has(value as KpNativeKatexSceneContribution);
}

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
