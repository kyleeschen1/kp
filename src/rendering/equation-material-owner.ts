import type {
  KpMaterialContinuant,
  KpMaterialContinuityPlan
} from "../animation/material-continuity.ts";

export interface KpEquationMaterialOwnerRegistry {
  readonly planId: string;
  readonly materialOwnerIdByContinuantId: ReadonlyMap<string, string>;
  readonly continuantIdByMotionId: ReadonlyMap<string, string>;
}

export interface KpEquationMaterialOwnershipFrame {
  readonly materialContinuantId: string;
  readonly ownerId: string;
  readonly semanticProgress: number;
  readonly materialOpacity: number;
  readonly sourceNativeOpacity: number;
  readonly targetNativeOpacity: number;
  readonly nativeHandoff: "source" | "material" | "target";
}

export interface KpEquationMaterialOwnerHandoff {
  readonly ownerId: string;
  readonly progress: number;
  readonly materialOpacity: number;
  readonly sourceNativeOpacity: number;
  readonly targetNativeOpacity: number;
  readonly nativeHandoff: "source" | "material" | "target";
}

const defaultNativeHandoffFraction = 0.08;

export function sampleKpEquationMaterialOwnerHandoff(input: {
  readonly ownerId: string;
  readonly progress: number;
  readonly sourcePresent: boolean;
  readonly targetPresent: boolean;
  readonly nativeHandoffFraction?: number;
}): KpEquationMaterialOwnerHandoff {
  const progress = clamp01(input.progress);
  const handoffFraction = input.nativeHandoffFraction
    ?? defaultNativeHandoffFraction;
  if (
    !Number.isFinite(handoffFraction)
    || handoffFraction <= 0
    || handoffFraction > 0.5
  ) {
    throw new Error("Native handoff fraction must be within (0, 0.5].");
  }

  const sourceNativeOpacity = input.sourcePresent
    ? 1 - smoothstep(clamp01(progress / handoffFraction))
    : 0;
  const targetNativeOpacity = input.targetPresent
    ? smoothstep(clamp01(
      (progress - (1 - handoffFraction)) / handoffFraction
    ))
    : 0;
  const materialOpacity = input.sourcePresent && input.targetPresent
    ? Math.min(1 - sourceNativeOpacity, 1 - targetNativeOpacity)
    : input.sourcePresent
      ? progress === 1 ? 0 : 1 - sourceNativeOpacity
      : input.targetPresent
        ? progress === 0 ? 0 : 1 - targetNativeOpacity
        : 0;

  return {
    ownerId: input.ownerId,
    progress,
    materialOpacity: clamp01(materialOpacity),
    sourceNativeOpacity,
    targetNativeOpacity,
    nativeHandoff: sourceNativeOpacity > 0
      ? "source"
      : targetNativeOpacity > 0
        ? "target"
        : "material"
  };
}

export function createKpEquationMaterialOwnerRegistry(
  plan: KpMaterialContinuityPlan
): KpEquationMaterialOwnerRegistry {
  const materialOwnerIdByContinuantId = new Map<string, string>();
  const continuantIdByMotionId = new Map<string, string>();
  for (const continuant of plan.materialContinuants) {
    materialOwnerIdByContinuantId.set(
      continuant.id,
      `material-owner.${continuant.id}`
    );
    for (const motionId of [
      ...continuant.sourceMotionIds,
      ...continuant.targetMotionIds
    ]) {
      const existing = continuantIdByMotionId.get(motionId);
      if (existing !== undefined && existing !== continuant.id) {
        throw new Error(
          `Motion id ${motionId} belongs to both ${existing} and ${continuant.id}.`
        );
      }
      continuantIdByMotionId.set(motionId, continuant.id);
    }
  }
  return {
    planId: plan.id,
    materialOwnerIdByContinuantId,
    continuantIdByMotionId
  };
}

export function sampleKpEquationMaterialOwnership(input: {
  readonly registry: KpEquationMaterialOwnerRegistry;
  readonly continuant: KpMaterialContinuant;
  readonly progress: number;
  readonly direction?: "forward" | "rewind";
}): KpEquationMaterialOwnershipFrame {
  const requested = clamp01(input.progress);
  const semanticProgress =
    input.direction === "rewind" ? 1 - requested : requested;
  const ownerId = input.registry.materialOwnerIdByContinuantId.get(
    input.continuant.id
  );
  if (ownerId === undefined) {
    throw new Error(
      `Material owner registry has no owner for ${input.continuant.id}.`
    );
  }

  // Native nodes are endpoint geometry authorities. The material owner is the
  // visual authority between them, preventing endpoint-only DOM replacement.
  if (semanticProgress <= 0) {
    return {
      materialContinuantId: input.continuant.id,
      ownerId,
      semanticProgress,
      materialOpacity: 0,
      sourceNativeOpacity: 1,
      targetNativeOpacity: 0,
      nativeHandoff: "source"
    };
  }
  if (semanticProgress >= 1) {
    return {
      materialContinuantId: input.continuant.id,
      ownerId,
      semanticProgress,
      materialOpacity: 0,
      sourceNativeOpacity: 0,
      targetNativeOpacity: 1,
      nativeHandoff: "target"
    };
  }
  return {
    materialContinuantId: input.continuant.id,
    ownerId,
    semanticProgress,
    materialOpacity: 1,
    sourceNativeOpacity: 0,
    targetNativeOpacity: 0,
    nativeHandoff: "material"
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Material ownership progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}
