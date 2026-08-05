import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  getKpEditorAnimationPlaybackSession
} from "./animation-player-controller.ts";

export interface KpEditorGraphSvgViewportModel {
  readonly width: number;
  readonly height: number;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
  readonly xAxisY: number;
  readonly yAxisX: number;
}

export interface KpEditorGraphAxisProjection {
  readonly originPolicy: "shared-endpoint" | "crossing";
  readonly x: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };
  readonly y: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };
}

export interface KpEditorGraphSvgViewportPresentation {
  readonly profileId: string;
  readonly languageId?: string | undefined;
  readonly axes: "visible" | "hidden";
  readonly axisMarkers: boolean;
  readonly xAxisEnd?: number | undefined;
}

export interface KpEditorGraphSvgViewportRenderInput {
  readonly animation: KpAnimationAsset;
  readonly content: SVGGElement;
  readonly model: KpEditorGraphSvgViewportModel;
  readonly player: HTMLElement;
  readonly slot: HTMLElement;
  readonly state: KpEditorAnimationPlayerState;
  readonly svg: SVGSVGElement;
}

export interface KpEditorGraphSvgViewportRenderer {
  presentation(input: {
    readonly animation: KpAnimationAsset;
    readonly model: KpEditorGraphSvgViewportModel;
  }): KpEditorGraphSvgViewportPresentation;
  render(input: KpEditorGraphSvgViewportRenderInput): void;
}

export function createKpEditorGraphSvgViewportModel(
  animation: KpAnimationAsset
): KpEditorGraphSvgViewportModel {
  const graph = animation.bundle.objects.find(
    (object) => object.objectType === "graph-2d"
  );
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
    xAxisY: scaleKpEditorGraphCoordinate(0, yDomain, [height - 28, 20]),
    yAxisX: scaleKpEditorGraphCoordinate(0, xDomain, [36, width - 20])
  };
}

export function projectKpEditorGraphAxes(input: {
  readonly viewport: KpEditorGraphSvgViewportModel;
  readonly xAxisEnd?: number | undefined;
}): KpEditorGraphAxisProjection {
  const { viewport } = input;
  const stopsAtOrigin = viewport.xDomain[0] === 0 && viewport.yDomain[0] === 0;
  // Zero-bounded plots terminate both axes at one geometric endpoint. Signed
  // domains retain full crossing axes because zero lies inside the plot.
  const xStart = stopsAtOrigin ? viewport.yAxisX : 20;
  const yStart = stopsAtOrigin ? viewport.xAxisY : viewport.height - 20;
  return Object.freeze({
    originPolicy: stopsAtOrigin ? "shared-endpoint" : "crossing",
    x: Object.freeze({
      x1: xStart,
      y1: viewport.xAxisY,
      x2: input.xAxisEnd ?? viewport.width - 20,
      y2: viewport.xAxisY
    }),
    y: Object.freeze({
      x1: viewport.yAxisX,
      y1: yStart,
      x2: viewport.yAxisX,
      y2: 20
    })
  });
}

export function createKpEditorGraphSvgViewportLifecycleAdapter(input: {
  readonly supportedAnimationIds: readonly string[];
  readonly renderer: KpEditorGraphSvgViewportRenderer;
}): KpEditorAnimationSurfaceAdapter {
  const supported = new Set(input.supportedAnimationIds);
  const adapter: KpEditorAnimationSurfaceAdapter = {
    id: "editor-animation-surface.graph.svg",
    slotKind: "graph",
    priority: 0,
    supports(state) {
      return state.surface.slotKinds.includes("graph") &&
        supported.has(state.animationId);
    },
    render({ player, slot, state }) {
      const animation = getKpEditorAnimationPlaybackSession(player)?.animation;
      if (animation === undefined) return;
      const model = createKpEditorGraphSvgViewportModel(animation);
      let svg = slot.querySelector<SVGSVGElement>(
        "[data-kp-editor-graph-svg]"
      );
      if (svg === null) {
        slot.innerHTML = renderViewportShell(
          model,
          state,
          input.renderer.presentation({ animation, model })
        );
        svg = slot.querySelector<SVGSVGElement>(
          "[data-kp-editor-graph-svg]"
        );
      }
      if (svg === null) return;
      svg.dataset["kpEditorGraphProgress"] = String(state.progress);
      svg.dataset["kpEditorGraphDirection"] = state.direction;
      const content = svg.querySelector<SVGGElement>(
        "[data-kp-editor-graph-content]"
      );
      if (content === null) return;
      input.renderer.render({ animation, content, model, player, slot, state, svg });
    }
  };
  return Object.freeze(adapter);
}

export function scaleKpEditorGraphCoordinate(
  value: number,
  from: readonly [number, number],
  to: readonly [number, number]
): number {
  return to[0] + ((value - from[0]) / (from[1] - from[0])) *
    (to[1] - to[0]);
}

function renderViewportShell(
  model: KpEditorGraphSvgViewportModel,
  state: KpEditorAnimationPlayerState,
  presentation: KpEditorGraphSvgViewportPresentation
): string {
  const languageProfile = presentation.languageId === undefined
    ? ""
    : ` data-kp-graph-language-profile="${presentation.languageId}"`;
  const axisMarker = presentation.axisMarkers
    ? ' marker-end="url(#kp-editor-graph-axis-arrow)"'
    : "";
  const axisProjection = projectKpEditorGraphAxes({
    viewport: model,
    ...(presentation.xAxisEnd === undefined
      ? {}
      : { xAxisEnd: presentation.xAxisEnd })
  });
  const axes = presentation.axes === "hidden"
    ? ""
    : `<line data-kp-editor-graph-axis="x" x1="${axisProjection.x.x1}" y1="${axisProjection.x.y1}" x2="${axisProjection.x.x2}" y2="${axisProjection.x.y2}"${axisMarker} />
    <line data-kp-editor-graph-axis="y" x1="${axisProjection.y.x1}" y1="${axisProjection.y.y1}" x2="${axisProjection.y.x2}" y2="${axisProjection.y.y2}"${axisMarker} />`;
  return `<svg class="editor-graph-stage" data-kp-editor-graph-svg data-kp-graph-presentation-profile="${presentation.profileId}"${languageProfile} data-kp-editor-graph-origin-policy="${axisProjection.originPolicy}" data-kp-editor-graph-progress="${state.progress}" data-kp-editor-graph-direction="${state.direction}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="${escapeHtml(state.runtimeFrame.title)} graph animation">
    <defs><pattern id="kp-editor-graph-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path class="editor-graph-stage__default-grid-line" d="M 32 0 L 0 0 0 32" fill="none" /></pattern><marker id="kp-editor-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker><marker id="kp-editor-graph-axis-arrow" data-kp-axis-arrow-scale="6" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
    <rect class="editor-graph-stage__plot-plane" width="100%" height="100%" />
    <g data-kp-editor-graph-content></g>
    ${axes}
  </svg>`;
}

function domain(
  value: unknown,
  fallback: readonly [number, number]
): readonly [number, number] {
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
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
