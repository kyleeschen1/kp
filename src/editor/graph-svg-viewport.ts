import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from "../animation/graph-runtime-frame.ts";
import { sampleDerivativeTangentRuntimeFrame } from "../animation/derivative-tangent-runtime-frame.ts";
import { sampleIntegralAreaSweepRuntimeFrame } from "../animation/integral-area-sweep-runtime-frame.ts";
import { sampleDotProjectionRuntimeFrame } from "../animation/dot-projection-runtime-frame.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import {
  kpEconomicsGraphPresentationProfile,
  renderKpEconomicsEquilibriumRuntimeContent
} from "../rendering/economics-equilibrium-svg.ts";
import {
  sampleKpConstantForceWorkEnergyRuntimeFrame
} from "../animation/constant-force-work-energy-runtime-frame.ts";
import {
  kpPhysicsGraphPresentationProfile,
  renderKpConstantForceWorkEnergyRuntimeContent
} from "../rendering/constant-force-work-energy-svg.ts";
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
      slot.innerHTML = renderViewport(animation, model, state);
      svg = slot.querySelector<SVGSVGElement>("[data-kp-editor-graph-svg]");
    }
    if (svg !== null) {
      svg.dataset["kpEditorGraphProgress"] = String(state.progress);
      svg.dataset["kpEditorGraphDirection"] = state.direction;
      const content = svg.querySelector<SVGGElement>("[data-kp-editor-graph-content]");
      if (content !== null) {
        content.innerHTML = renderRuntimeContent(animation, state, model);
        syncGraphAccessibility(svg, content);
      }
    }
  }
};

export function registerKpEditorGraphSvgViewportAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorGraphSvgViewportAdapter
  );
}

function syncGraphAccessibility(
  svg: SVGSVGElement,
  content: SVGGElement
): void {
  const description = content.querySelector<SVGDescElement>(
    "[data-kp-economics-nonvisual-summary], [data-kp-physics-nonvisual-summary]"
  );
  if (description?.id === undefined || description.id.length === 0) {
    svg.removeAttribute("aria-describedby");
    return;
  }
  // The graph stays one image in the accessibility tree while its exact
  // frame summary follows direct seek, rewind, and parameter replacement.
  svg.setAttribute("aria-describedby", description.id);
}

function renderViewport(
  animation: KpAnimationAsset,
  model: KpEditorGraphSvgViewportModel,
  state: KpEditorAnimationPlayerState
): string {
  const economicsProfile = animation.id ===
    "animation.economics.supply-demand-equilibrium-shift";
  const physicsProfile = animation.id ===
    "animation.physics.constant-force-work-energy";
  const profile = economicsProfile
    ? kpEconomicsGraphPresentationProfile.id
    : physicsProfile
      ? kpPhysicsGraphPresentationProfile.id
      : "kp.graph.editor-default.v1";
  const axisMarker = economicsProfile
    ? ' marker-end="url(#kp-editor-graph-axis-arrow)"'
    : "";
  const axes = physicsProfile
    ? ""
    : `<line data-kp-editor-graph-axis="x" x1="20" y1="${model.xAxisY}" x2="${model.width - 20}" y2="${model.xAxisY}"${axisMarker} />
    <line data-kp-editor-graph-axis="y" x1="${model.yAxisX}" y1="${model.height - 20}" x2="${model.yAxisX}" y2="20"${axisMarker} />`;
  return `<svg class="editor-graph-stage" data-kp-editor-graph-svg data-kp-graph-presentation-profile="${profile}" data-kp-editor-graph-progress="${state.progress}" data-kp-editor-graph-direction="${state.direction}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="${escapeHtml(state.runtimeFrame.title)} graph animation">
    <defs><pattern id="kp-editor-graph-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path class="editor-graph-stage__default-grid-line" d="M 32 0 L 0 0 0 32" fill="none" /></pattern><marker id="kp-editor-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker><marker id="kp-editor-graph-axis-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
    <rect class="editor-graph-stage__plot-plane" width="100%" height="100%" />
    <g data-kp-editor-graph-content></g>
    ${axes}
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
      const secant = frame.secantSegment.map((coordinates) => point(coordinates));
      const tangent = frame.tangentSegment.map((coordinates) => point(coordinates));
      const anchor = point([frame.anchorX, frame.anchorY]);
      const moving = point([frame.movingX, frame.movingY]);
      return `<polyline class="editor-graph-stage__curve" points="${curve.map((p) => p.join(",")).join(" ")}" />
        <line class="editor-graph-stage__tangent-target" data-kp-editor-graph-tangent-target data-kp-editor-graph-tangent-slope="${frame.tangentSlope}" x1="${tangent[0]![0]}" y1="${tangent[0]![1]}" x2="${tangent[1]![0]}" y2="${tangent[1]![1]}" style="opacity:${0.12 + frame.derivativeRevealProgress * 0.48}" />
        <line class="editor-graph-stage__secant" data-kp-editor-graph-secant data-kp-editor-graph-tangent data-kp-editor-graph-secant-h="${frame.h}" data-kp-editor-graph-secant-slope="${frame.secantSlope}" data-kp-editor-graph-tangent-slope="${frame.secantSlope}" x1="${secant[0]![0]}" y1="${secant[0]![1]}" x2="${secant[1]![0]}" y2="${secant[1]![1]}" />
        <line class="editor-graph-stage__secant-span" data-kp-editor-graph-secant-span x1="${anchor[0]}" y1="${anchor[1]}" x2="${moving[0]}" y2="${moving[1]}" style="opacity:${frame.movingPointOpacity}" />
        <circle class="editor-graph-stage__point editor-graph-stage__point--anchor" data-kp-editor-graph-tangent-point data-kp-editor-graph-anchor-point data-kp-editor-graph-tangent-x="${frame.anchorX}" cx="${anchor[0]}" cy="${anchor[1]}" r="5" />
        <circle class="editor-graph-stage__point editor-graph-stage__point--secant" data-kp-editor-graph-secant-point data-kp-editor-graph-secant-x="${frame.movingX}" cx="${moving[0]}" cy="${moving[1]}" r="5" style="opacity:${frame.movingPointOpacity}" />
        ${renderDerivativeMath(frame, model)}`;
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
    case "animation.economics.supply-demand-equilibrium-shift": {
      const economicsFrame = sampleKpEconomicsEquilibriumRuntimeFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      });
      return renderKpEconomicsEquilibriumRuntimeContent({
        frame: economicsFrame,
        viewport: model
      });
    }
    case "animation.physics.constant-force-work-energy": {
      const physicsFrame = sampleKpConstantForceWorkEnergyRuntimeFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      });
      return renderKpConstantForceWorkEnergyRuntimeContent({
        frame: physicsFrame,
        viewport: model
      });
    }
    default:
      return "";
  }
}

function renderDerivativeMath(
  frame: ReturnType<typeof sampleDerivativeTangentRuntimeFrame>,
  model: KpEditorGraphSvgViewportModel
): string {
  return `<foreignObject class="editor-graph-stage__math-foreign-object" x="18" y="12" width="356" height="116">
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__math-panel">
        <div data-kp-editor-graph-function-context data-kp-latex="${escapeHtml(frame.contextLatex)}">${renderLatexToHtml(frame.contextLatex, { displayMode: false })}</div>
        <div data-kp-editor-graph-difference-quotient data-kp-latex="${escapeHtml(frame.differenceQuotientLatex)}">${renderLatexToHtml(frame.differenceQuotientLatex, { displayMode: false })}</div>
        <div data-kp-editor-graph-current-sample data-kp-latex="${escapeHtml(frame.currentSampleLatex)}">${renderLatexToHtml(frame.currentSampleLatex, { displayMode: false })}</div>
      </div>
    </foreignObject>
    <foreignObject class="editor-graph-stage__math-foreign-object" x="18" y="${model.height - 58}" width="${model.width - 36}" height="48">
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__math-limit" data-kp-editor-graph-derivative-expression data-kp-latex="${escapeHtml(frame.convergenceLatex)}" style="opacity:${0.35 + 0.65 * frame.derivativeRevealProgress}">
        ${renderLatexToHtml(frame.convergenceLatex, { displayMode: false })}
      </div>
    </foreignObject>`;
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
