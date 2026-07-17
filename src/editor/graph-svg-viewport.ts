import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from "../animation/graph-runtime-frame.ts";
import { sampleDerivativeTangentRuntimeFrame } from "../animation/derivative-tangent-runtime-frame.ts";
import { sampleIntegralAreaSweepRuntimeFrame } from "../animation/integral-area-sweep-runtime-frame.ts";
import { sampleDotProjectionRuntimeFrame } from "../animation/dot-projection-runtime-frame.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import { getKpEditorAnimationPlaybackSession } from "./animation-player-controller.ts";

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
  render({ player, slot, state }) {
    const animation = getKpEditorAnimationPlaybackSession(player)?.animation;
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
      const content = svg.querySelector<SVGGElement>("[data-kp-editor-graph-content]");
      if (content !== null) content.innerHTML = renderRuntimeContent(animation, state, model);
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
    <defs><pattern id="kp-editor-graph-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dce6ed" stroke-width="1" /></pattern><marker id="kp-editor-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
    <rect width="100%" height="100%" fill="url(#kp-editor-graph-grid)" />
    <line data-kp-editor-graph-axis="x" x1="20" y1="${model.xAxisY}" x2="${model.width - 20}" y2="${model.xAxisY}" />
    <line data-kp-editor-graph-axis="y" x1="${model.yAxisX}" y1="20" x2="${model.yAxisX}" y2="${model.height - 20}" />
    <g data-kp-editor-graph-content></g>
  </svg>`;
}

function renderRuntimeContent(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  model: KpEditorGraphSvgViewportModel
): string {
  const point = (coordinates: readonly number[]) => [
    scale(coordinates[0] ?? 0, model.xDomain, [36, model.width - 20]),
    scale(coordinates[1] ?? 0, model.yDomain, [model.height - 28, 20])
  ] as const;
  const origin = point([0, 0]);

  switch (animation.id) {
    case "animation.graph.vector.linear-map-scale": {
      const frame = sampleLinearMapVectorGraphRuntimeFrame({ animation, runtimeFrame: state.runtimeFrame });
      const source = point(frame.sourceCoordinates);
      const end = point(frame.currentCoordinates);
      const target = point(frame.targetCoordinates);
      return `<line class="editor-graph-stage__path" x1="${source[0]}" y1="${source[1]}" x2="${target[0]}" y2="${target[1]}" /><line class="editor-graph-stage__vector editor-graph-stage__vector--ghost" data-kp-editor-graph-vector-source x1="${origin[0]}" y1="${origin[1]}" x2="${source[0]}" y2="${source[1]}" marker-end="url(#kp-editor-graph-arrow)" /><line class="editor-graph-stage__vector" data-kp-editor-graph-vector data-kp-editor-graph-vector-coordinates="${frame.currentCoordinates.join(",")}" x1="${origin[0]}" y1="${origin[1]}" x2="${end[0]}" y2="${end[1]}" marker-end="url(#kp-editor-graph-arrow)" />${renderAnnotation(`v(t) = (${frame.currentCoordinates.map(formatNumber).join(", ")})`, model)}`;
    }
    case "animation.derivative-rules.tangent-graph": {
      const frame = sampleDerivativeTangentRuntimeFrame({ animation, runtimeFrame: state.runtimeFrame });
      const curve = Array.from({ length: 61 }, (_, index) => {
        const x = -2 + index / 12;
        return point([x, x ** 3]);
      });
      const tangent = frame.tangentSegment.map((coordinates) => point(coordinates));
      const current = point([frame.x, frame.y]);
      return `<polyline class="editor-graph-stage__curve" points="${curve.map((p) => p.join(",")).join(" ")}" /><line class="editor-graph-stage__tangent" data-kp-editor-graph-tangent data-kp-editor-graph-tangent-slope="${frame.slope}" x1="${tangent[0]![0]}" y1="${tangent[0]![1]}" x2="${tangent[1]![0]}" y2="${tangent[1]![1]}" /><circle class="editor-graph-stage__point" data-kp-editor-graph-tangent-point data-kp-editor-graph-tangent-x="${frame.x}" cx="${current[0]}" cy="${current[1]}" r="5" />${renderAnnotation(`x = ${formatNumber(frame.x)} · slope = ${formatNumber(frame.slope)}`, model)}`;
    }
    case "animation.integral-ftc.area-sweep": {
      const frame = sampleIntegralAreaSweepRuntimeFrame({ animation, runtimeFrame: state.runtimeFrame });
      const polygon = frame.areaPolygon.map(point);
      const boundBase = point([frame.upperBound, 0]);
      const boundTop = point([frame.upperBound, frame.integrandAtUpperBound]);
      return `<polygon class="editor-graph-stage__area" data-kp-editor-graph-area data-kp-editor-graph-area-value="${frame.accumulatedArea}" points="${polygon.map((p) => p.join(",")).join(" ")}" /><line class="editor-graph-stage__sweep" data-kp-editor-graph-area-bound data-kp-editor-graph-upper-bound="${frame.upperBound}" x1="${boundBase[0]}" y1="${boundBase[1]}" x2="${boundTop[0]}" y2="${boundTop[1]}" /><text class="editor-graph-stage__label" data-kp-editor-graph-area-label x="${model.width - 130}" y="32">Area ${frame.accumulatedArea.toFixed(2)}</text>${renderAnnotation(`b = ${formatNumber(frame.upperBound)} · area = ${formatNumber(frame.accumulatedArea)}`, model)}`;
    }
    case "animation.dot-projection.basic": {
      const frame = sampleDotProjectionRuntimeFrame({ animation, runtimeFrame: state.runtimeFrame });
      const left = point(frame.leftVector);
      const right = point(frame.rightVector);
      const drop = point(frame.dropPoint);
      return `<line class="editor-graph-stage__vector" x1="${origin[0]}" y1="${origin[1]}" x2="${left[0]}" y2="${left[1]}" marker-end="url(#kp-editor-graph-arrow)" /><line class="editor-graph-stage__vector editor-graph-stage__vector--secondary" x1="${origin[0]}" y1="${origin[1]}" x2="${right[0]}" y2="${right[1]}" marker-end="url(#kp-editor-graph-arrow)" /><line class="editor-graph-stage__projection" data-kp-editor-graph-projection data-kp-editor-graph-drop-point="${frame.dropPoint.join(",")}" x1="${left[0]}" y1="${left[1]}" x2="${drop[0]}" y2="${drop[1]}" /><circle class="editor-graph-stage__point" data-kp-editor-graph-projection-point data-kp-editor-graph-dot-product="${frame.dotProduct}" cx="${drop[0]}" cy="${drop[1]}" r="5" />${renderAnnotation(`a·b = ${formatNumber(frame.dotProduct)} · drop = (${frame.dropPoint.map(formatNumber).join(", ")})`, model)}`;
    }
    default:
      return "";
  }
}

function renderAnnotation(value: string, model: KpEditorGraphSvgViewportModel): string {
  return `<text class="editor-graph-stage__annotation" data-kp-editor-graph-annotation x="36" y="${model.height - 10}">${value}</text>`;
}

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
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
