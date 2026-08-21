/// <reference types="vite/client" />

import { sampleKpSemanticMotionChoreography } from
  "../domain-ir/public-api.ts";
import { createKpEquationFontReadiness } from
  "../rendering/equation-font-readiness.ts";
import {
  bindKpLogProductNativeEndpointOwnership,
  kpCanonicalLogProductNativeEndpoints,
  settleAndObserveKpLogProductNativeEndpoint,
  type KpLogProductNativeEndpoint
} from "../rendering/log-product-native-endpoints.ts";
import {
  createKpLogProductTransitSession,
  type KpLogProductTransitSession
} from "../rendering/log-product-transit-session.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import { syncKpEquationMaterialLayer } from
  "../rendering/equation-material-layer-dom.ts";
import {
  KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID,
  kpLogProductEquivalenceFrame,
  kpLogProductEquivalenceFrameOccurrenceIds
} from "../semantic/log-product-equivalence-frame.ts";
import { kpCanonicalLogProductSemanticMotionBundle } from
  "../semantic/log-product-semantic-motion.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import type { KpEditorAnimationPlayerState } from
  "./animation-player-state.ts";
import type { KpEditorAnimationSurfaceAdapter } from
  "./animation-surface-adapter-registry.ts";

interface KpLogProductEquivalenceSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly frozenSource: HTMLElement;
  readonly relation: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly materialLayer: HTMLElement;
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpLogProductTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement,
  KpLogProductEquivalenceSurfaceSession>();

export const kpEditorLogProductEquivalenceFrameSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.log-product.equivalence-frame.native-katex",
  slotKind: "equation" as const,
  priority: 133,
  supports(state) {
    return state.animationId ===
      KP_LOG_PRODUCT_EQUIVALENCE_FRAME_ANIMATION_ID;
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (session === undefined) {
      session = mountSurface(player, slot, state);
      sessions.set(player, session);
      player.addEventListener(KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeSurface(player, session!), { once: true });
      const generation = ++session.generation;
      void prepareSurface(session, generation);
    }
    session.pendingState = state;
    if (session.transit !== undefined) applyFrame(session, state);
  }
} satisfies KpEditorAnimationSurfaceAdapter);

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState
): KpLogProductEquivalenceSurfaceSession {
  const document = player.ownerDocument;
  const frame = document.createElement("div");
  frame.className = "kp-log-product-equivalence-stage__frame";
  const sourceCell = document.createElement("div");
  sourceCell.className = "kp-log-product-equivalence-stage__cell";
  const targetCell = document.createElement("div");
  targetCell.className = "kp-log-product-equivalence-stage__cell";
  const frozenSource = document.createElement("div");
  frozenSource.className =
    "kp-log-product-equivalence-stage__frozen-source";
  frozenSource.dataset["kpStateRetentionOccurrenceId"] =
    kpLogProductEquivalenceFrameOccurrenceIds.source;
  frozenSource.innerHTML =
    kpCanonicalLogProductNativeEndpoints[0].nativeHtmlAndMathml;
  const relation = document.createElement("div");
  relation.className = "kp-log-product-equivalence-stage__relation";
  relation.dataset["kpStateRetentionOccurrenceId"] =
    kpLogProductEquivalenceFrameOccurrenceIds.relation;
  relation.innerHTML = renderLatexToHtml("=", {
    displayMode: true,
    output: "htmlAndMathml"
  });
  setRelationProgress(relation, 0);
  const endpointRoots: [HTMLElement, HTMLElement] = [
    createMeasurementRoot(document, kpCanonicalLogProductNativeEndpoints[0],
      "source"),
    createMeasurementRoot(document, kpCanonicalLogProductNativeEndpoints[1],
      "target")
  ];
  sourceCell.append(frozenSource, endpointRoots[0]);
  targetCell.append(endpointRoots[1]);
  frame.append(sourceCell, relation, targetCell);
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-log-product-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  materialLayer.style.visibility = "hidden";
  const status = document.createElement("output");
  status.className = "kp-log-product-stage__status";
  status.dataset["kpLogProductEquivalenceStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Logarithm product expression ready.";
  const stage = document.createElement("section");
  stage.className =
    "kp-log-product-stage kp-log-product-equivalence-stage";
  stage.dataset["kpLogProductEquivalenceStage"] = "preparing";
  stage.dataset["kpStateRetentionProjectionId"] =
    kpLogProductEquivalenceFrame.projection.id;
  stage.dataset["kpStateRetentionPolicy"] =
    kpLogProductEquivalenceFrame.projection.policy;
  stage.setAttribute("aria-label",
    "The logarithm product law retained as an equivalence");
  stage.append(frame, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    frozenSource,
    relation,
    endpointRoots: Object.freeze(endpointRoots) as readonly [HTMLElement,
      HTMLElement],
    materialLayer,
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    disposed: false
  };
}

function createMeasurementRoot(
  document: Document,
  endpoint: KpLogProductNativeEndpoint,
  side: "source" | "target"
): HTMLElement {
  const root = document.createElement("div");
  root.className =
    `kp-log-product-stage__endpoint ` +
    `kp-log-product-equivalence-stage__measurement ` +
    `kp-log-product-equivalence-stage__measurement--${side}`;
  root.dataset["kpLogProductEndpointStateId"] = endpoint.stateId;
  root.dataset["kpStateRetentionOccurrenceId"] = side === "source"
    ? kpLogProductEquivalenceFrame.projection.transitOccurrence.id
    : kpLogProductEquivalenceFrameOccurrenceIds.target;
  root.innerHTML = endpoint.nativeHtmlAndMathml;
  root.style.opacity = "0";
  root.setAttribute("aria-hidden", "true");
  root.setAttribute("inert", "");
  bindKpLogProductNativeEndpointOwnership({ root, endpoint });
  return root;
}

async function prepareSurface(
  session: KpLogProductEquivalenceSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const source = await settleAndObserveKpLogProductNativeEndpoint({
      endpointSide: "source",
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: kpCanonicalLogProductNativeEndpoints[0],
      fontReadiness: session.fontReadiness
    });
    const target = await settleAndObserveKpLogProductNativeEndpoint({
      endpointSide: "target",
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: kpCanonicalLogProductNativeEndpoints[1],
      fontReadiness: session.fontReadiness
    });
    if (session.disposed || session.generation !== generation) return;
    const runtime = kpCanonicalLogProductSemanticMotionBundle;
    session.transit = createKpLogProductTransitSession({
      operation: runtime.operation,
      semanticMotion: runtime.choreography,
      sourceEndpoint: kpCanonicalLogProductNativeEndpoints[0],
      targetEndpoint: kpCanonicalLogProductNativeEndpoints[1],
      source,
      target
    });
    session.stage.dataset["kpLogProductEquivalenceStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpLogProductEquivalenceStage"] = "failed";
    session.stage.dataset["kpLogProductEquivalenceError"] =
      error instanceof Error ? error.message : String(error);
  }
}

function applyFrame(
  session: KpLogProductEquivalenceSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const accessibilityMode =
    session.player.dataset["kpEditorAnimationAccessibilityMode"] ??
    "full-motion";
  const motion = kpCanonicalLogProductSemanticMotionBundle.choreography;
  const frame = sampleKpSemanticMotionChoreography({
    choreography: motion,
    progress: state.progress,
    direction: state.direction,
    reducedMotion: accessibilityMode === "reduced-motion" ||
      accessibilityMode === "static"
  });
  const progress = frame.semanticProgress;
  const relationProgress = Math.min(1, progress / 0.18);
  setRelationProgress(session.relation, relationProgress);
  const ownership = session.transit.apply(progress);
  session.materialLayer.style.visibility = progress === 0
    ? "hidden"
    : "visible";
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("inert", "");
  });
  if (ownership.visualOwner === "target-native") {
    session.endpointRoots[1].setAttribute("aria-hidden", "false");
    session.endpointRoots[1].removeAttribute("inert");
  }
  session.stage.dataset["kpLogProductEquivalenceProgress"] = String(progress);
  session.stage.dataset["kpLogProductEquivalenceVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-log-product-equivalence-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? "Logarithm product expression ready."
      : progress === 1
        ? "The retained source equals the constructed sum of logarithms."
        : "The source remains while a distinct equivalent expression is constructed.";
  }
}

function setRelationProgress(relation: HTMLElement, progress: number): void {
  relation.style.opacity = String(progress);
  relation.style.transform = `scale(${String(0.82 + 0.18 * progress)})`;
  relation.style.visibility = progress === 0 ? "hidden" : "visible";
  relation.setAttribute("aria-hidden", progress === 0 ? "true" : "false");
}

function disposeSurface(
  player: HTMLElement,
  session: KpLogProductEquivalenceSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
