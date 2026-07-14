import type {
  KpAnimationRuntimeFrame
} from "../animation/runtime-sampler.ts";
import {
  createKpAnimationVisualFrame,
  type KpAnimationVisualBinding,
  type KpAnimationVisualFrame,
  type KpAnimationVisualGeometry,
  type KpAnimationVisualRendererKind
} from "../animation/visual-frame-adapter.ts";

export interface CreateGraphRuntimeVisualFrameInput {
  readonly id?: string | undefined;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly renderTargetRef?: string | undefined;
  readonly renderTargetGeometry?: KpAnimationVisualGeometry | undefined;
  readonly renderer?: KpAnimationVisualRendererKind | undefined;
  readonly selectorRefs?: Readonly<Record<string, string>> | undefined;
  readonly selectorGeometry?:
    | Readonly<Record<string, KpAnimationVisualGeometry>>
    | undefined;
}

export function createGraphRuntimeVisualFrame(
  input: CreateGraphRuntimeVisualFrameInput
): KpAnimationVisualFrame {
  const renderer = input.renderer ?? "svg";
  const bindings: KpAnimationVisualBinding[] = [
    ...input.runtimeFrame.activeRenderTargets
      .filter((target) => target.kind === "graph")
      .map((target): KpAnimationVisualBinding => ({
        id: `graph-render-target.${target.id}`,
        kind: "render-target",
        targetId: target.id,
        renderer,
        ref: input.renderTargetRef ?? `graph-render-target.${target.id}`,
        ...(input.renderTargetGeometry === undefined
          ? {}
          : { geometry: { ...input.renderTargetGeometry } })
      })),
    ...input.runtimeFrame.selectorFrames.map((selector) => {
      const geometry = input.selectorGeometry?.[selector.id];

      return {
        id: `graph-selector.${selector.id}`,
        kind: "selector",
        targetId: selector.id,
        renderer,
        ref: input.selectorRefs?.[selector.id] ?? `graph-selector.${selector.id}`,
        ...(geometry === undefined ? {} : { geometry: { ...geometry } })
      } satisfies KpAnimationVisualBinding;
    })
  ];

  return createKpAnimationVisualFrame({
    id: input.id,
    runtimeFrame: input.runtimeFrame,
    bindings
  });
}
