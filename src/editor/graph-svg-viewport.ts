import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import {
  economicsEquilibriumAnimationId,
} from "../animation/economics-equilibrium-adapter.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame,
  type KpEconomicsEquilibriumRuntimeFrame
} from "../animation/economics-equilibrium-runtime-frame.ts";
import {
  kpEconomicsGraphPlotInsets,
  kpEconomicsGraphPresentationProfile
} from "../rendering/economics-equilibrium-svg.ts";
import type {
  KpEconomicsInlineLatexRenderer
} from "../rendering/economics-equilibrium-svg.ts";
import {
  createKpEconomicsEquilibriumRuntimeSession,
  type KpEconomicsEquilibriumRuntimeSession
} from "../rendering/economics-equilibrium-runtime-session.ts";
import {
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  createKpEditorGraphSvgViewportLifecycleAdapter,
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

export function createKpEconomicsGraphSvgViewportAdapter(input: {
  readonly renderInlineLatex: KpEconomicsInlineLatexRenderer;
}):
KpEditorAnimationSurfaceAdapter {
  return createKpEditorGraphSvgViewportLifecycleAdapter({
    adapterId: "editor-animation-surface.graph.svg.economics",
    supportedAnimationIds: [economicsEquilibriumAnimationId],
    renderer: createKpEconomicsGraphSvgViewportRenderer(
      input.renderInlineLatex
    )
  });
}

export function createKpEconomicsGraphSvgViewportRenderer(
  renderInlineLatex: KpEconomicsInlineLatexRenderer
) {
  return Object.freeze({
    presentation: economicsGraphSvgViewportPresentation,
    render: (input: KpEditorGraphSvgViewportRenderInput) =>
      renderEconomicsGraphSvgFrame(input, renderInlineLatex)
  });
}

function renderEconomicsGraphSvgFrame({
  animation,
  content,
  model,
  player,
  slot,
  state,
  svg
}: KpEditorGraphSvgViewportRenderInput,
renderInlineLatex: KpEconomicsInlineLatexRenderer): void {
      const economicsProfile = economicsGraphRuntimePerformanceSession(
        player,
        slot
      );
      if (economicsProfile !== undefined) economicsProfile.metrics.renderCalls += 1;
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
                viewport: model,
                renderInlineLatex
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

function economicsGraphSvgViewportPresentation(input: {
  readonly animation: KpAnimationAsset;
  readonly model: KpEditorGraphSvgViewportModel;
}): KpEditorGraphSvgViewportPresentation {
  return Object.freeze({
    profileId: kpEconomicsGraphPresentationProfile.id,
    languageId: kpEconomicsGraphPresentationProfile.languageId,
    axes: "visible" as const,
    axisMarkers: true,
    xAxisEnd: input.model.width - kpEconomicsGraphPlotInsets.right
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

export function disposeKpEconomicsGraphSvgViewport(slot: HTMLElement): void {
  disposeEconomicsMountedRuntimeSession(slot);
  disposeEconomicsScreenSpaceLabels(slot);
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

function syncGraphAccessibility(
  svg: SVGSVGElement,
  content: SVGGElement
): void {
  const description = content.querySelector<SVGDescElement>(
    "[data-kp-economics-nonvisual-summary]"
  );
  if (description?.id === undefined || description.id.length === 0) {
    svg.removeAttribute("aria-describedby");
    return;
  }
  // The graph stays one image in the accessibility tree while its exact
  // frame summary follows direct seek, rewind, and parameter replacement.
  svg.setAttribute("aria-describedby", description.id);
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
