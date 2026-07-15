import { createKpAnimationAssets } from "../animation/catalog.ts";
import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

const catalog = createKpAnimationAssets();

export interface KpEditorGraphSvgViewportModel {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
  readonly xAxisY: number;
  readonly yAxisX: number;
}

export function createKpEditorGraphSvgViewportModel(
  animation: KpAnimationAsset
): KpEditorGraphSvgViewportModel {
  const graph = animation.bundle.objects.find((object) => object.objectType === "graph-2d");
  const value = isRecord(graph?.value) ? graph.value : {};
  const width = positiveNumber(value["width"], 560);
  const height = positiveNumber(value["height"], 380);
  const xDomain = domain(value["xDomain"], [-5, 5]);
  const yDomain = domain(value["yDomain"], [-5, 5]);

  return {
    width,
    height,
    xDomain,
    yDomain,
    xAxisY: scale(0, yDomain, [height - 28, 20]),
    yAxisX: scale(0, xDomain, [36, width - 20])
  };
}

export const kpEditorGraphSvgViewportAdapter: KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.graph.svg",
  slotKind: "graph",
  priority: 0,
  supports(state) {
    return state.surface.slotKinds.includes("graph");
  },
  render({ slot, state }) {
    const animation = catalog.find((candidate) => candidate.id === state.animationId);
    if (animation === undefined) return;
    const model = createKpEditorGraphSvgViewportModel(animation);
    let svg = slot.querySelector<SVGSVGElement>("[data-kp-editor-graph-svg]");
    if (svg === null) {
      slot.innerHTML = renderViewport(model, state);
      svg = slot.querySelector<SVGSVGElement>("[data-kp-editor-graph-svg]");
    }
    if (svg !== null) {
      svg.dataset["kpEditorGraphProgress"] = String(state.progress);
      svg.dataset["kpEditorGraphDirection"] = state.direction;
    }
  }
};

export function registerKpEditorGraphSvgViewportAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorGraphSvgViewportAdapter
  );
}

function renderViewport(
  model: KpEditorGraphSvgViewportModel,
  state: KpEditorAnimationPlayerState
): string {
  return `<svg class="editor-graph-stage" data-kp-editor-graph-svg data-kp-editor-graph-progress="${state.progress}" data-kp-editor-graph-direction="${state.direction}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="${escapeHtml(state.runtimeFrame.title)} graph animation">
    <defs><pattern id="kp-editor-graph-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dce6ed" stroke-width="1" /></pattern></defs>
    <rect width="100%" height="100%" fill="url(#kp-editor-graph-grid)" />
    <line data-kp-editor-graph-axis="x" x1="20" y1="${model.xAxisY}" x2="${model.width - 20}" y2="${model.xAxisY}" />
    <line data-kp-editor-graph-axis="y" x1="${model.yAxisX}" y1="20" x2="${model.yAxisX}" y2="${model.height - 20}" />
    <g data-kp-editor-graph-content></g>
  </svg>`;
}

function scale(value: number, from: readonly [number, number], to: readonly [number, number]): number {
  return to[0] + ((value - from[0]) / (from[1] - from[0])) * (to[1] - to[0]);
}

function domain(value: unknown, fallback: readonly [number, number]): readonly [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)
    ? [Number(value[0]), Number(value[1])]
    : fallback;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && value > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
