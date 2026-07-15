import type {
  KpAnimationAssetRenderTargetKind
} from "../animation/asset.ts";
import type {
  KpEditorAnimationDescriptor
} from "./animation-descriptor.ts";

export type KpEditorAnimationSurfaceKind =
  | "equation"
  | "graph"
  | "programming"
  | "composite"
  | "unsupported";

export type KpEditorAnimationSurfaceSlotKind =
  | "equation"
  | "graph"
  | "programming";

export interface KpEditorAnimationSurfaceDispatch {
  readonly descriptorId: string;
  readonly animationId: string;
  readonly kind: KpEditorAnimationSurfaceKind;
  readonly slotKinds: readonly KpEditorAnimationSurfaceSlotKind[];
  readonly unsupportedTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
}

export function dispatchKpEditorAnimationSurface(
  descriptor: KpEditorAnimationDescriptor
): KpEditorAnimationSurfaceDispatch {
  const unsupportedTargetKinds = unique(
    descriptor.renderTargetKinds.filter(
      (kind) => surfaceSlotKind(kind) === undefined
    )
  );
  const slotKinds = unique(
    descriptor.renderTargetKinds.flatMap((kind) => {
      const slot = surfaceSlotKind(kind);
      return slot === undefined ? [] : [slot];
    })
  );

  // Partial rendering would overstate editor support, so any unsupported
  // target keeps the whole descriptor out of an executable surface.
  const kind = unsupportedTargetKinds.length > 0 || slotKinds.length === 0
    ? "unsupported"
    : slotKinds.length > 1
      ? "composite"
      : slotKinds[0]!;

  return {
    descriptorId: descriptor.id,
    animationId: descriptor.animationId,
    kind,
    slotKinds,
    unsupportedTargetKinds
  };
}

function surfaceSlotKind(
  kind: KpAnimationAssetRenderTargetKind
): KpEditorAnimationSurfaceSlotKind | undefined {
  switch (kind) {
    case "equation":
    case "matrix":
      return "equation";
    case "graph":
      return "graph";
    case "programming":
      return "programming";
    case "custom":
    case "dashboard":
    case "export":
      return undefined;
  }
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
