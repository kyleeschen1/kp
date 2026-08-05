import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from "../animation/graph-runtime-frame.ts";
import { sampleDerivativeTangentRuntimeFrame } from "../animation/derivative-tangent-runtime-frame.ts";
import { sampleIntegralAreaSweepRuntimeFrame } from "../animation/integral-area-sweep-runtime-frame.ts";
import { sampleDotProjectionRuntimeFrame } from "../animation/dot-projection-runtime-frame.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame,
  type KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import {
  kpEconomicsGraphPlotInsets,
  kpEconomicsGraphPresentationProfile,
  renderKpEconomicsEquilibriumRuntimeContent
} from "../rendering/economics-equilibrium-svg.ts";
import {
  createKpEconomicsEquilibriumRuntimeSession,
  type KpEconomicsEquilibriumRuntimeSession
} from "../rendering/economics-equilibrium-runtime-session.ts";
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
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  createKpEditorGraphSvgViewportLifecycleAdapter,
  scaleKpEditorGraphCoordinate,
  type KpEditorGraphSvgViewportModel,
  type KpEditorGraphSvgViewportPresentation,
  type KpEditorGraphSvgViewportRenderInput
} from "./graph-svg-viewport-lifecycle.ts";

export {
  createKpEditorGraphSvgViewportModel,
  projectKpEditorGraphAxes,
  type KpEditorGraphAxisProjection,
  type KpEditorGraphSvgViewportModel
} from "./graph-svg-viewport-lifecycle.ts";

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

const economicsMountedRuntimeSessions = new WeakMap<
  HTMLElement,
  KpEconomicsEquilibriumRuntimeSession
>();

export function createKpEditorGraphSvgViewportAdapter(
  supportedAnimationIds: readonly string[]
): KpEditorAnimationSurfaceAdapter {
  return createKpEditorGraphSvgViewportLifecycleAdapter({
    supportedAnimationIds,
    renderer: {
      presentation: graphSvgViewportPresentation,
      render: renderGraphSvgDomainFrame
    }
  });
}

function renderGraphSvgDomainFrame({
  animation,
  content,
  model,
  player,
  slot,
  state,
  svg
}: KpEditorGraphSvgViewportRenderInput): void {
      if (
        animation.id !==
          "animation.economics.supply-demand-equilibrium-shift"
      ) {
        disposeEconomicsMountedRuntimeSession(slot);
      }
      const economicsProfile = animation.id ===
        "animation.economics.supply-demand-equilibrium-shift"
        ? economicsGraphRuntimePerformanceSession(player, slot)
        : undefined;
      if (economicsProfile !== undefined) economicsProfile.metrics.renderCalls += 1;
          if (
            animation.id ===
              "animation.economics.supply-demand-equilibrium-shift"
          ) {
            const economicsFrame = sampleEconomicsRuntimeFrame(
              animation,
              state,
              economicsProfile?.metrics
            );
            let runtime = economicsMountedRuntimeSessions.get(slot);
            if (runtime?.content !== content || runtime.status === "disposed") {
              runtime?.dispose();
              runtime = createKpEconomicsEquilibriumRuntimeSession({
                content,
                frame: economicsFrame,
                viewport: model
              });
              economicsMountedRuntimeSessions.set(slot, runtime);
              player.addEventListener(
                KP_EDITOR_ANIMATION_DISPOSE_EVENT,
                () => disposeEconomicsMountedRuntimeSession(slot),
                { once: true }
              );
            } else {
              runtime.apply({ frame: economicsFrame, viewport: model });
            }
            const accessibilityStartedAt = economicsProfile === undefined
              ? 0
              : performanceNow(player);
            syncGraphAccessibility(svg, content);
            if (economicsProfile !== undefined) {
              economicsProfile.metrics.accessibilitySyncTotalMs +=
                performanceNow(player) - accessibilityStartedAt;
            }
            syncEconomicsLabelsForCurrentMode({
              animationId: animation.id,
              content,
              economicsProfile,
              model,
              player,
              slot,
              svg
            });
            return;
          }
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
          syncEconomicsLabelsForCurrentMode({
            animationId: animation.id,
            content,
            economicsProfile,
            model,
            player,
            slot,
            svg
          });
}

function graphSvgViewportPresentation(input: {
  readonly animation: KpAnimationAsset;
  readonly model: KpEditorGraphSvgViewportModel;
}): KpEditorGraphSvgViewportPresentation {
  const economicsProfile = input.animation.id ===
    "animation.economics.supply-demand-equilibrium-shift";
  const physicsProfile = input.animation.id ===
    "animation.physics.constant-force-work-energy";
  const vectorProjectionProfile = input.animation.id ===
    "animation.dot-projection.basic";
  const matrixLinearMapProfile = input.animation.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two";
  const profile = economicsProfile
    ? kpEconomicsGraphPresentationProfile
    : physicsProfile
      ? kpPhysicsGraphPresentationProfile
      : vectorProjectionProfile
        ? kpVectorDotProjectionGraphPresentationProfile
        : matrixLinearMapProfile
          ? kpMatrixLinearMapGraphPresentationProfile
          : undefined;
  return Object.freeze({
    profileId: profile?.id ?? "kp.graph.editor-default.v1",
    ...(profile === undefined ? {} : { languageId: profile.languageId }),
    axes: physicsProfile ? "hidden" : "visible",
    axisMarkers: profile !== undefined,
    ...(economicsProfile
      ? { xAxisEnd: input.model.width - kpEconomicsGraphPlotInsets.right }
      : {})
  });
}

function sampleEconomicsRuntimeFrame(
  animation: KpAnimationAsset,
  state: KpEditorAnimationPlayerState,
  economicsProfile?: MutableKpEconomicsGraphRuntimeMetrics | undefined
): KpEconomicsEquilibriumRuntimeFrame {
  const sampleStartedAt = economicsProfile === undefined ? 0 : performanceNow();
  const frame = sampleKpEconomicsEquilibriumRuntimeFrame({
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
  return frame;
}

function disposeEconomicsMountedRuntimeSession(slot: HTMLElement): void {
  economicsMountedRuntimeSessions.get(slot)?.dispose();
  economicsMountedRuntimeSessions.delete(slot);
}

function syncEconomicsLabelsForCurrentMode(input: {
  readonly animationId: string;
  readonly content: SVGGElement;
  readonly economicsProfile?:
    | KpEconomicsGraphRuntimePerformanceSession
    | undefined;
  readonly model: KpEditorGraphSvgViewportModel;
  readonly player: HTMLElement;
  readonly slot: HTMLElement;
  readonly svg: SVGSVGElement;
}): void {
  if (
    input.animationId !==
      "animation.economics.supply-demand-equilibrium-shift" ||
    input.player.closest("[data-kp-economics-screen-space-labels='true']") ===
      null
  ) {
    disposeEconomicsScreenSpaceLabels(input.slot);
    return;
  }
  const startedAt = input.economicsProfile === undefined
    ? 0
    : performanceNow(input.player);
  syncEconomicsScreenSpaceLabels(input);
  if (input.economicsProfile !== undefined) {
    const duration = performanceNow(input.player) - startedAt;
    input.economicsProfile.metrics.screenLabelSyncs += 1;
    input.economicsProfile.metrics.screenLabelSyncTotalMs += duration;
    input.economicsProfile.metrics.screenLabelSyncLongestMs = Math.max(
      input.economicsProfile.metrics.screenLabelSyncLongestMs,
      duration
    );
  }
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
    if (label.innerHTML !== source.innerHTML) {
      patchRetainedEconomicsLabelMarkup(label, source);
    }
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

function patchRetainedEconomicsLabelMarkup(
  target: HTMLElement,
  source: HTMLElement
): void {
  const targetElements = Array.from(target.querySelectorAll("*"));
  const sourceElements = Array.from(source.querySelectorAll("*"));
  const sameTopology = targetElements.length === sourceElements.length &&
    targetElements.every((element, index) => {
      const sourceElement = sourceElements[index];
      return sourceElement !== undefined &&
        element.localName === sourceElement.localName &&
        element.getAttribute("class") === sourceElement.getAttribute("class");
    });
  if (!sameTopology) {
    target.innerHTML = source.innerHTML;
    return;
  }
  const targetText = textNodes(target);
  const sourceText = textNodes(source);
  if (targetText.length !== sourceText.length) {
    target.innerHTML = source.innerHTML;
    return;
  }
  targetText.forEach((node, index) => {
    const value = sourceText[index]?.nodeValue;
    if (value !== undefined && node.nodeValue !== value) node.nodeValue = value;
  });
}

function textNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );
  let current = walker.nextNode();
  while (current !== null) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
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
  return scaleKpEditorGraphCoordinate(value, from, to);
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
