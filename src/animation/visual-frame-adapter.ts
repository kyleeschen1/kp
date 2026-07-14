import type {
  KpAnimationRuntimeClock,
  KpAnimationRuntimeFrame,
  KpAnimationRuntimeRenderTargetFrame,
  KpAnimationRuntimeSelectorFrame
} from "./runtime-sampler.ts";

export type KpAnimationVisualRendererKind =
  | "dom"
  | "svg"
  | "canvas"
  | "webgl"
  | "custom";

export type KpAnimationVisualBindingKind =
  | "render-target"
  | "selector"
  | "object"
  | "custom";

export interface KpAnimationVisualGeometry {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly z?: number | undefined;
  readonly opacity?: number | undefined;
  readonly scaleX?: number | undefined;
  readonly scaleY?: number | undefined;
}

export interface KpAnimationVisualBinding {
  readonly id: string;
  readonly kind: KpAnimationVisualBindingKind;
  readonly targetId: string;
  readonly renderer: KpAnimationVisualRendererKind;
  readonly ref: string;
  readonly geometry?: KpAnimationVisualGeometry | undefined;
  readonly metadata?: Readonly<Record<string, string | number | boolean>> | undefined;
}

export interface CreateKpAnimationVisualFrameInput {
  readonly id?: string | undefined;
  readonly runtimeFrame: KpAnimationRuntimeFrame;
  readonly bindings: readonly KpAnimationVisualBinding[];
}

export interface KpAnimationVisualFrame {
  readonly id: string;
  readonly kind: "animation-visual-frame";
  readonly runtimeFrameId: string;
  readonly animationId: string;
  readonly title: string;
  readonly clock: KpAnimationRuntimeClock;
  readonly phaseId: string;
  readonly activeTransformationIds: readonly string[];
  readonly activeAnnotationIds: readonly string[];
  readonly nodes: readonly KpAnimationVisualNode[];
  readonly renderTargetVisuals: readonly KpAnimationVisualRenderTarget[];
  readonly selectorVisuals: readonly KpAnimationVisualSelector[];
  readonly diagnostics: readonly KpAnimationVisualFrameDiagnostic[];
}

export interface KpAnimationVisualNode extends KpAnimationVisualBinding {}

export interface KpAnimationVisualRenderTarget {
  readonly renderTargetId: string;
  readonly kind: KpAnimationRuntimeRenderTargetFrame["kind"];
  readonly nodeIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly selectorIds: readonly string[];
  readonly activeTransformationIds: readonly string[];
}

export interface KpAnimationVisualSelector {
  readonly selectorId: string;
  readonly objectId: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly nodeIds: readonly string[];
  readonly roles: readonly KpAnimationRuntimeSelectorFrame["roles"][number][];
  readonly activeTransformationIds: readonly string[];
  readonly annotationIds: readonly string[];
  readonly renderTargetIds: readonly string[];
}

export interface KpAnimationVisualFrameDiagnostic {
  readonly severity: "info" | "warning" | "error";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export function createKpAnimationVisualFrame(
  input: CreateKpAnimationVisualFrameInput
): KpAnimationVisualFrame {
  const nodes = input.bindings.map(cloneVisualNode);
  const renderTargetVisuals = input.runtimeFrame.activeRenderTargets.map(
    (target) => visualRenderTarget(target, nodes)
  );
  const selectorVisuals = input.runtimeFrame.selectorFrames.map((selector) =>
    visualSelector(selector, nodes)
  );

  return {
    id: input.id ?? `visual.${input.runtimeFrame.id}`,
    kind: "animation-visual-frame",
    runtimeFrameId: input.runtimeFrame.id,
    animationId: input.runtimeFrame.animationId,
    title: input.runtimeFrame.title,
    clock: { ...input.runtimeFrame.clock },
    phaseId: input.runtimeFrame.phase.phaseId,
    activeTransformationIds: [...input.runtimeFrame.activeTransformationIds],
    activeAnnotationIds: [...input.runtimeFrame.activeAnnotationIds],
    nodes,
    renderTargetVisuals,
    selectorVisuals,
    diagnostics: visualFrameDiagnostics({
      renderTargetVisuals,
      selectorVisuals
    })
  };
}

function visualRenderTarget(
  target: KpAnimationRuntimeRenderTargetFrame,
  nodes: readonly KpAnimationVisualNode[]
): KpAnimationVisualRenderTarget {
  return {
    renderTargetId: target.id,
    kind: target.kind,
    nodeIds: nodeIdsFor(nodes, "render-target", target.id),
    objectIds: [...target.objectIds],
    selectorIds: [...target.selectorIds],
    activeTransformationIds: [...target.activeTransformationIds]
  };
}

function visualSelector(
  selector: KpAnimationRuntimeSelectorFrame,
  nodes: readonly KpAnimationVisualNode[]
): KpAnimationVisualSelector {
  return {
    selectorId: selector.id,
    objectId: selector.objectId,
    kind: selector.kind,
    ...(selector.label === undefined ? {} : { label: selector.label }),
    nodeIds: nodeIdsFor(nodes, "selector", selector.id),
    roles: [...selector.roles],
    activeTransformationIds: [...selector.activeTransformationIds],
    annotationIds: [...selector.annotationIds],
    renderTargetIds: [...selector.renderTargetIds]
  };
}

function visualFrameDiagnostics(input: {
  readonly renderTargetVisuals: readonly KpAnimationVisualRenderTarget[];
  readonly selectorVisuals: readonly KpAnimationVisualSelector[];
}): readonly KpAnimationVisualFrameDiagnostic[] {
  return [
    ...input.renderTargetVisuals.flatMap((target) =>
      target.nodeIds.length === 0
        ? [{
            severity: "warning" as const,
            code: "visual-frame.render-target-unbound",
            path: `activeRenderTargets[${target.renderTargetId}]`,
            message:
              `Active render target ${target.renderTargetId} has no visual binding.`
          }]
        : []
    ),
    ...input.selectorVisuals.flatMap((selector) =>
      selector.nodeIds.length === 0
        ? [{
            severity: "warning" as const,
            code: "visual-frame.selector-unbound",
            path: `selectorFrames[${selector.selectorId}]`,
            message:
              `Runtime selector ${selector.selectorId} has no visual binding.`
          }]
        : []
    )
  ];
}

function nodeIdsFor(
  nodes: readonly KpAnimationVisualNode[],
  kind: KpAnimationVisualBindingKind,
  targetId: string
): readonly string[] {
  return nodes
    .filter((node) => node.kind === kind && node.targetId === targetId)
    .map((node) => node.id);
}

function cloneVisualNode(
  node: KpAnimationVisualBinding
): KpAnimationVisualNode {
  return {
    id: node.id,
    kind: node.kind,
    targetId: node.targetId,
    renderer: node.renderer,
    ref: node.ref,
    ...(node.geometry === undefined
      ? {}
      : { geometry: { ...node.geometry } }),
    ...(node.metadata === undefined
      ? {}
      : { metadata: { ...node.metadata } })
  };
}
