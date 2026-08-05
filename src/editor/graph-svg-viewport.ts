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
  kpEconomicsGraphPlotInsets,
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
  kpVectorDotProjectionGraphPresentationProfile,
  renderKpVectorDotProjectionRuntimeContent
} from "../rendering/vector-dot-projection-svg.ts";
import {
  createKpMatrixLinearMapPlan,
  sampleKpMatrixLinearMapFrame,
  type KpMatrixLinearMapAccessibilityMode,
  type KpMatrixLinearMapPlan
} from "../animation/matrix-linear-map-frame.ts";
import {
  kpMatrixLinearMapGraphPresentationProfile,
  renderKpMatrixLinearMapRuntimeContent
} from "../rendering/matrix-linear-map-svg.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT,
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

export interface KpEconomicsGraphRuntimeMetrics {
  readonly renderCalls: number;
  readonly semanticSamples: number;
  readonly semanticSampleTotalMs: number;
  readonly semanticSampleLongestMs: number;
  readonly svgStringsBuilt: number;
  readonly svgStringCharacters: number;
  readonly svgConstructionTotalMs: number;
  readonly svgConstructionLongestMs: number;
  readonly subtreeReplacements: number;
  readonly removedElements: number;
  readonly addedElements: number;
  readonly subtreeReplacementTotalMs: number;
  readonly subtreeReplacementLongestMs: number;
  readonly accessibilitySyncTotalMs: number;
  readonly screenLabelSyncs: number;
  readonly screenLabelSyncTotalMs: number;
  readonly screenLabelSyncLongestMs: number;
}

const matrixLinearMapPlanCache = new Map<string, KpMatrixLinearMapPlan>();

interface KpEconomicsScreenSpaceLabelSession {
  readonly overlay: HTMLElement;
  readonly resizeObserver?: ResizeObserver | undefined;
  readonly svg: SVGSVGElement;
}

const economicsScreenSpaceLabelSessions = new WeakMap<
  HTMLElement,
  KpEconomicsScreenSpaceLabelSession
>();

interface KpEconomicsGraphRuntimePerformanceSession {
  metrics: MutableKpEconomicsGraphRuntimeMetrics;
  readonly api: {
    readonly reset: () => void;
    readonly snapshot: () => KpEconomicsGraphRuntimeMetrics;
  };
}

type MutableKpEconomicsGraphRuntimeMetrics = {
  -readonly [Key in keyof KpEconomicsGraphRuntimeMetrics]:
    KpEconomicsGraphRuntimeMetrics[Key]
};

type KpEconomicsGraphPerformanceWindow = Window & {
  __kpEconomicsPerformanceProbeRequested?: boolean | undefined;
  __kpEconomicsGraphRuntimePerformance?:
    KpEconomicsGraphRuntimePerformanceSession["api"] | undefined;
};

const economicsGraphRuntimePerformanceSessions = new WeakMap<
  HTMLElement,
  KpEconomicsGraphRuntimePerformanceSession
>();

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

export function createKpEditorGraphSvgViewportAdapter(
  supportedAnimationIds: readonly string[]
): KpEditorAnimationSurfaceAdapter {
  const supported = new Set(supportedAnimationIds);
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
      const economicsProfile = animation.id ===
        "animation.economics.supply-demand-equilibrium-shift"
        ? economicsGraphRuntimePerformanceSession(player, slot)
        : undefined;
      if (economicsProfile !== undefined) economicsProfile.metrics.renderCalls += 1;
      const model = createKpEditorGraphSvgViewportModel(animation);
      let svg = slot.querySelector<SVGSVGElement>("[data-kp-editor-graph-svg]");
      if (svg === null) {
        slot.innerHTML = renderViewport(animation, model, state);
        svg = slot.querySelector<SVGSVGElement>("[data-kp-editor-graph-svg]");
      }
      if (svg !== null) {
        svg.dataset["kpEditorGraphProgress"] = String(state.progress);
        svg.dataset["kpEditorGraphDirection"] = state.direction;
        const content = svg.querySelector<SVGGElement>(
          "[data-kp-editor-graph-content]"
        );
        if (content !== null) {
          const runtimeContent = renderRuntimeContent(
            animation,
            state,
            model,
            graphAccessibilityMode(player),
            economicsProfile?.metrics
          );
          const replacementStartedAt = economicsProfile === undefined
            ? 0
            : performanceNow(player);
          const removedElements = economicsProfile === undefined
            ? 0
            : content.querySelectorAll("*").length;
          content.innerHTML = runtimeContent;
          if (economicsProfile !== undefined) {
            const duration = performanceNow(player) - replacementStartedAt;
            economicsProfile.metrics.subtreeReplacements += 1;
            economicsProfile.metrics.removedElements += removedElements;
            economicsProfile.metrics.addedElements +=
              content.querySelectorAll("*").length;
            economicsProfile.metrics.subtreeReplacementTotalMs += duration;
            economicsProfile.metrics.subtreeReplacementLongestMs = Math.max(
              economicsProfile.metrics.subtreeReplacementLongestMs,
              duration
            );
          }
          const accessibilityStartedAt = economicsProfile === undefined
            ? 0
            : performanceNow(player);
          syncGraphAccessibility(svg, content);
          if (economicsProfile !== undefined) {
            economicsProfile.metrics.accessibilitySyncTotalMs +=
              performanceNow(player) - accessibilityStartedAt;
          }
          if (
            animation.id ===
              "animation.economics.supply-demand-equilibrium-shift" &&
            player.closest("[data-kp-economics-screen-space-labels='true']")
              !== null
          ) {
            const screenLabelsStartedAt = economicsProfile === undefined
              ? 0
              : performanceNow(player);
            syncEconomicsScreenSpaceLabels({
              content,
              model,
              player,
              slot,
              svg
            });
            if (economicsProfile !== undefined) {
              const duration = performanceNow(player) - screenLabelsStartedAt;
              economicsProfile.metrics.screenLabelSyncs += 1;
              economicsProfile.metrics.screenLabelSyncTotalMs += duration;
              economicsProfile.metrics.screenLabelSyncLongestMs = Math.max(
                economicsProfile.metrics.screenLabelSyncLongestMs,
                duration
              );
            }
          } else {
            disposeEconomicsScreenSpaceLabels(slot);
          }
        }
      }
    }
  };
  return Object.freeze(adapter);
}

function syncEconomicsScreenSpaceLabels(input: {
  readonly content: SVGGElement;
  readonly model: KpEditorGraphSvgViewportModel;
  readonly player: HTMLElement;
  readonly slot: HTMLElement;
  readonly svg: SVGSVGElement;
}): void {
  const session = economicsScreenSpaceLabelSession(input);
  const extantLabels = new Map(
    Array.from(session.overlay.querySelectorAll<HTMLElement>(
      "[data-kp-economics-screen-space-label]"
    )).map((label) => [
      label.dataset["kpEconomicsScreenSpaceLabel"] ?? "",
      label
    ])
  );
  const currentRoles = new Set<string>();

  input.content.querySelectorAll<SVGForeignObjectElement>(
    "[data-kp-economics-math-label]"
  ).forEach((anchor) => {
    const role = anchor.dataset["kpEconomicsMathLabel"];
    const source = anchor.querySelector<HTMLElement>(
      ".editor-graph-stage__economics-math-label"
    );
    const fallbackX = Number(anchor.getAttribute("x"));
    const fallbackY = Number(anchor.getAttribute("y"));
    const x = Number(
      anchor.dataset["kpEconomicsScreenAnchorX"] ?? fallbackX
    );
    const y = Number(
      anchor.dataset["kpEconomicsScreenAnchorY"] ?? fallbackY
    );
    if (
      role === undefined || source === null ||
      !Number.isFinite(x) || !Number.isFinite(y)
    ) {
      return;
    }

    currentRoles.add(role);
    let label = extantLabels.get(role);
    if (label === undefined) {
      label = input.slot.ownerDocument.createElement("span");
      label.dataset["kpEconomicsScreenSpaceLabel"] = role;
      session.overlay.append(label);
    }
    label.dataset["kpEconomicsLabelDisclosure"] =
      role.startsWith("axis-") || role.startsWith("tick-")
        ? "persistent"
        : "contextual";
    label.className =
      `${source.className} editor-graph-stage__economics-screen-space-label`;
    label.dataset["kpLatex"] = source.dataset["kpLatex"] ?? "";
    if (label.innerHTML !== source.innerHTML) label.innerHTML = source.innerHTML;
    label.style.left = `${x / input.model.width * 100}%`;
    label.style.top = `${y / input.model.height * 100}%`;
    label.style.setProperty(
      "--kp-economics-label-entry-opacity",
      anchor.style.opacity === "" ? "1" : anchor.style.opacity
    );
  });

  for (const [role, label] of extantLabels) {
    if (!currentRoles.has(role)) label.remove();
  }
  input.slot.dataset["kpEconomicsScreenSpaceLabelsReady"] = "true";
}

function economicsScreenSpaceLabelSession(input: {
  readonly model: KpEditorGraphSvgViewportModel;
  readonly player: HTMLElement;
  readonly slot: HTMLElement;
  readonly svg: SVGSVGElement;
}): KpEconomicsScreenSpaceLabelSession {
  const extant = economicsScreenSpaceLabelSessions.get(input.slot);
  if (extant?.svg === input.svg) return extant;
  disposeEconomicsScreenSpaceLabels(input.slot);

  const overlay = input.slot.ownerDocument.createElement("div");
  overlay.className = "editor-graph-stage__economics-screen-space-overlay";
  overlay.dataset["kpEconomicsScreenSpaceOverlay"] = "true";
  overlay.setAttribute("aria-hidden", "true");
  input.slot.append(overlay);

  const resizeObserver = typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver(() => positionEconomicsScreenSpaceLabelOverlay(
        input.slot,
        input.svg,
        overlay,
        input.model
      ));
  resizeObserver?.observe(input.svg);
  const session = { overlay, resizeObserver, svg: input.svg };
  economicsScreenSpaceLabelSessions.set(input.slot, session);
  input.player.addEventListener(
    KP_EDITOR_ANIMATION_DISPOSE_EVENT,
    () => disposeEconomicsScreenSpaceLabels(input.slot),
    { once: true }
  );
  positionEconomicsScreenSpaceLabelOverlay(
    input.slot,
    input.svg,
    overlay,
    input.model
  );
  return session;
}

function positionEconomicsScreenSpaceLabelOverlay(
  slot: HTMLElement,
  svg: SVGSVGElement,
  overlay: HTMLElement,
  model: KpEditorGraphSvgViewportModel
): void {
  const slotBounds = slot.getBoundingClientRect();
  const svgBounds = svg.getBoundingClientRect();
  const scale = Math.min(
    svgBounds.width / model.width,
    svgBounds.height / model.height
  );
  const width = model.width * scale;
  const height = model.height * scale;
  overlay.style.left =
    `${svgBounds.left - slotBounds.left + (svgBounds.width - width) / 2}px`;
  overlay.style.top =
    `${svgBounds.top - slotBounds.top + (svgBounds.height - height) / 2}px`;
  overlay.style.width = `${width}px`;
  overlay.style.height = `${height}px`;
}

function disposeEconomicsScreenSpaceLabels(slot: HTMLElement): void {
  const session = economicsScreenSpaceLabelSessions.get(slot);
  if (session === undefined) return;
  session.resizeObserver?.disconnect();
  session.overlay.remove();
  delete slot.dataset["kpEconomicsScreenSpaceLabelsReady"];
  economicsScreenSpaceLabelSessions.delete(slot);
}

export function registerKpEditorGraphSvgViewportAdapter(
  supportedAnimationIds: readonly string[]
): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    createKpEditorGraphSvgViewportAdapter(supportedAnimationIds)
  );
}

function syncGraphAccessibility(
  svg: SVGSVGElement,
  content: SVGGElement
): void {
  const description = content.querySelector<SVGDescElement>(
    "[data-kp-economics-nonvisual-summary], " +
    "[data-kp-physics-nonvisual-summary], " +
    "[data-kp-vector-nonvisual-summary], " +
    "[data-kp-matrix-linear-map-nonvisual-summary]"
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
  const vectorProjectionProfile = animation.id ===
    "animation.dot-projection.basic";
  const matrixLinearMapProfile = animation.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two";
  const dimensionalContinuityProfile = economicsProfile
    ? kpEconomicsGraphPresentationProfile
    : physicsProfile
      ? kpPhysicsGraphPresentationProfile
      : vectorProjectionProfile
        ? kpVectorDotProjectionGraphPresentationProfile
        : matrixLinearMapProfile
          ? kpMatrixLinearMapGraphPresentationProfile
          : undefined;
  const profile = dimensionalContinuityProfile?.id ??
    "kp.graph.editor-default.v1";
  const languageProfile = dimensionalContinuityProfile === undefined
    ? ""
    : ` data-kp-graph-language-profile="${dimensionalContinuityProfile.languageId}"`;
  const axisMarker = dimensionalContinuityProfile !== undefined
    ? ' marker-end="url(#kp-editor-graph-axis-arrow)"'
    : "";
  const xAxisEnd = economicsProfile
    ? model.width - kpEconomicsGraphPlotInsets.right
    : model.width - 20;
  const axisProjection = projectKpEditorGraphAxes({
    viewport: model,
    xAxisEnd
  });
  const axes = physicsProfile
    ? ""
    : `<line data-kp-editor-graph-axis="x" x1="${axisProjection.x.x1}" y1="${axisProjection.x.y1}" x2="${axisProjection.x.x2}" y2="${axisProjection.x.y2}"${axisMarker} />
    <line data-kp-editor-graph-axis="y" x1="${axisProjection.y.x1}" y1="${axisProjection.y.y1}" x2="${axisProjection.y.x2}" y2="${axisProjection.y.y2}"${axisMarker} />`;
  return `<svg class="editor-graph-stage" data-kp-editor-graph-svg data-kp-graph-presentation-profile="${profile}"${languageProfile} data-kp-editor-graph-origin-policy="${axisProjection.originPolicy}" data-kp-editor-graph-progress="${state.progress}" data-kp-editor-graph-direction="${state.direction}" viewBox="0 0 ${model.width} ${model.height}" role="img" aria-label="${escapeHtml(state.runtimeFrame.title)} graph animation">
    <defs><pattern id="kp-editor-graph-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path class="editor-graph-stage__default-grid-line" d="M 32 0 L 0 0 0 32" fill="none" /></pattern><marker id="kp-editor-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker><marker id="kp-editor-graph-axis-arrow" data-kp-axis-arrow-scale="6" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="strokeWidth" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
    <rect class="editor-graph-stage__plot-plane" width="100%" height="100%" />
    <g data-kp-editor-graph-content></g>
    ${axes}
  </svg>`;
}

function renderRuntimeContent(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  model: KpEditorGraphSvgViewportModel,
  accessibilityMode: KpMatrixLinearMapAccessibilityMode,
  economicsProfile?: MutableKpEconomicsGraphRuntimeMetrics | undefined
): string {
  const point = (coordinates: readonly number[]) => [
    scale(coordinates[0] ?? 0, model.xDomain, [36, model.width - 20]),
    scale(coordinates[1] ?? 0, model.yDomain, [model.height - 28, 20])
  ] as const;
  const origin = point([0, 0]);

  switch (animation.id) {
    case "animation.generated.linear-algebra.matrix-vector.two-by-two": {
      let plan = matrixLinearMapPlanCache.get(animation.id);
      if (plan === undefined) {
        plan = createKpMatrixLinearMapPlan(animation);
        matrixLinearMapPlanCache.set(animation.id, plan);
      }
      return renderKpMatrixLinearMapRuntimeContent({
        frame: sampleKpMatrixLinearMapFrame({
          plan,
          progress: state.progress,
          direction: state.direction,
          accessibilityMode
        }),
        viewport: model
      });
    }
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
      return renderKpVectorDotProjectionRuntimeContent({
        frame,
        viewport: model
      });
    }
    case "animation.economics.supply-demand-equilibrium-shift": {
      const sampleStartedAt = economicsProfile === undefined
        ? 0
        : performanceNow();
      const economicsFrame = sampleKpEconomicsEquilibriumRuntimeFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      });
      if (economicsProfile !== undefined) {
        const duration = performanceNow() - sampleStartedAt;
        economicsProfile.semanticSamples += 1;
        economicsProfile.semanticSampleTotalMs += duration;
        economicsProfile.semanticSampleLongestMs = Math.max(
          economicsProfile.semanticSampleLongestMs,
          duration
        );
      }
      const constructionStartedAt = economicsProfile === undefined
        ? 0
        : performanceNow();
      const content = renderKpEconomicsEquilibriumRuntimeContent({
        frame: economicsFrame,
        viewport: model
      });
      if (economicsProfile !== undefined) {
        const duration = performanceNow() - constructionStartedAt;
        economicsProfile.svgStringsBuilt += 1;
        economicsProfile.svgStringCharacters += content.length;
        economicsProfile.svgConstructionTotalMs += duration;
        economicsProfile.svgConstructionLongestMs = Math.max(
          economicsProfile.svgConstructionLongestMs,
          duration
        );
      }
      return content;
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

function economicsGraphRuntimePerformanceSession(
  player: HTMLElement,
  slot: HTMLElement
): KpEconomicsGraphRuntimePerformanceSession | undefined {
  const view = player.ownerDocument.defaultView as
    KpEconomicsGraphPerformanceWindow | null;
  if (view?.__kpEconomicsPerformanceProbeRequested !== true) return undefined;
  const extant = economicsGraphRuntimePerformanceSessions.get(slot);
  if (extant !== undefined) return extant;

  const session: KpEconomicsGraphRuntimePerformanceSession = {
    metrics: emptyEconomicsGraphRuntimeMetrics(),
    api: {
      reset: () => {
        session.metrics = emptyEconomicsGraphRuntimeMetrics();
      },
      snapshot: () => Object.freeze({ ...session.metrics })
    }
  };
  economicsGraphRuntimePerformanceSessions.set(slot, session);
  view.__kpEconomicsGraphRuntimePerformance = session.api;
  player.addEventListener(KP_EDITOR_ANIMATION_DISPOSE_EVENT, () => {
    economicsGraphRuntimePerformanceSessions.delete(slot);
    if (view.__kpEconomicsGraphRuntimePerformance === session.api) {
      delete view.__kpEconomicsGraphRuntimePerformance;
    }
  }, { once: true });
  return session;
}

function emptyEconomicsGraphRuntimeMetrics():
  MutableKpEconomicsGraphRuntimeMetrics {
  return {
    renderCalls: 0,
    semanticSamples: 0,
    semanticSampleTotalMs: 0,
    semanticSampleLongestMs: 0,
    svgStringsBuilt: 0,
    svgStringCharacters: 0,
    svgConstructionTotalMs: 0,
    svgConstructionLongestMs: 0,
    subtreeReplacements: 0,
    removedElements: 0,
    addedElements: 0,
    subtreeReplacementTotalMs: 0,
    subtreeReplacementLongestMs: 0,
    accessibilitySyncTotalMs: 0,
    screenLabelSyncs: 0,
    screenLabelSyncTotalMs: 0,
    screenLabelSyncLongestMs: 0
  };
}

function performanceNow(player?: HTMLElement): number {
  return player?.ownerDocument.defaultView?.performance.now() ?? performance.now();
}

function graphAccessibilityMode(
  player: HTMLElement
): KpMatrixLinearMapAccessibilityMode {
  const value = player.dataset["kpEditorAnimationAccessibilityMode"];
  return value === "reduced-motion" || value === "static" || value === "narrated"
    ? value
    : "full-motion";
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
