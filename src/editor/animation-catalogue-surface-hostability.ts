import type {
  KpAnimationAssetRenderTargetKind
} from "../animation/asset.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapterRegistry
} from "./animation-surface-adapter-registry.ts";
import type {
  KpEditorAnimationSurfaceKind,
  KpEditorAnimationSurfaceSlotKind
} from "./animation-surface-dispatch.ts";

export type KpAnimationCatalogueSurfaceHostabilityStatus =
  | "ready"
  | "missing-adapter"
  | "unsupported-surface";

export interface KpAnimationCatalogueSurfaceSlotHostability {
  readonly slotKind: KpEditorAnimationSurfaceSlotKind;
  readonly status: "ready" | "missing-adapter";
  readonly adapterId?: string | undefined;
}

export interface KpAnimationCatalogueSurfaceHostability {
  readonly schemaVersion: "kp.animation-catalogue-surface-hostability.v1";
  readonly kind: "animation-catalogue-surface-hostability";
  readonly descriptorId: string;
  readonly animationId: string;
  readonly surfaceKind: KpEditorAnimationSurfaceKind;
  readonly status: KpAnimationCatalogueSurfaceHostabilityStatus;
  readonly slots: readonly KpAnimationCatalogueSurfaceSlotHostability[];
  readonly unsupportedTargetKinds:
    readonly KpAnimationAssetRenderTargetKind[];
}

export function inspectKpAnimationCatalogueSurfaceHostability(input: {
  readonly state: KpEditorAnimationPlayerState;
  readonly registry: KpEditorAnimationSurfaceAdapterRegistry;
}): KpAnimationCatalogueSurfaceHostability {
  const slots = input.state.surface.slotKinds.map((slotKind) => {
    const adapter = input.registry.resolve(slotKind, input.state);
    return Object.freeze({
      slotKind,
      status: adapter === undefined
        ? "missing-adapter" as const
        : "ready" as const,
      ...(adapter === undefined ? {} : { adapterId: adapter.id })
    });
  });
  const unsupportedTargetKinds = Object.freeze([
    ...input.state.surface.unsupportedTargetKinds
  ]);

  // Dispatch recognizes a surface vocabulary; hostability additionally
  // requires every slot to resolve against adapters present in this host.
  const status: KpAnimationCatalogueSurfaceHostabilityStatus =
    unsupportedTargetKinds.length > 0 || slots.length === 0
      ? "unsupported-surface"
      : slots.some((slot) => slot.status === "missing-adapter")
        ? "missing-adapter"
        : "ready";

  return Object.freeze({
    schemaVersion: "kp.animation-catalogue-surface-hostability.v1" as const,
    kind: "animation-catalogue-surface-hostability" as const,
    descriptorId: input.state.descriptorId,
    animationId: input.state.animationId,
    surfaceKind: input.state.surface.kind,
    status,
    slots: Object.freeze(slots),
    unsupportedTargetKinds
  });
}
