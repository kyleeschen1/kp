import type {
  KpEditorAnimationSurfaceSlotKind
} from "./animation-surface-dispatch.ts";
import {
  supportsKpEditorGraphSvgAnimation
} from "./graph-svg-surface-support.ts";

export type KpEditorSelectedSurfaceCapability =
  | "equation-katex"
  | "graph-svg-katex-labels";

export function deriveKpEditorSelectedSurfaceCapabilities(input: {
  readonly animationId: string;
  readonly slotKinds: readonly KpEditorAnimationSurfaceSlotKind[];
}): readonly KpEditorSelectedSurfaceCapability[] {
  const capabilities: KpEditorSelectedSurfaceCapability[] = [];
  if (input.slotKinds.includes("equation")) {
    capabilities.push("equation-katex");
  }
  if (
    input.slotKinds.includes("graph") &&
    supportsKpEditorGraphSvgAnimation(input.animationId)
  ) {
    capabilities.push("graph-svg-katex-labels");
  }
  return Object.freeze(capabilities);
}
