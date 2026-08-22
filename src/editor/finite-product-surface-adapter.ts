/// <reference types="vite/client" />

import { kpFiniteProductExpansionExemplarId } from
  "../animation/finite-product-expansion-exemplar.ts";
import { createKpEquationFontReadiness } from
  "../rendering/equation-font-readiness.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import { syncKpEquationMaterialLayer } from
  "../rendering/equation-material-layer-dom.ts";
import {
  bindKpFiniteProductNativeEndpointOwnership,
  kpCanonicalFiniteProductNativeEndpoints,
  settleAndObserveKpFiniteProductNativeEndpoint
} from "../rendering/finite-product-native-endpoints.ts";
import { createKpNativeKatexRenderedEndpointHandle } from
  "../rendering/native-katex-rendered-scene.ts";
import { measureKpNativeKatexSubtreePaintRect } from
  "../rendering/native-katex-paint-geometry.ts";
import {
  createKpFiniteProductTransitSession,
  type KpFiniteProductTransitSession
} from "../rendering/finite-product-transit-session.ts";
import {
  kpFiniteProductEquivalenceFrame,
  kpFiniteProductEquivalenceFrameOccurrenceIds
} from "../semantic/finite-product-equivalence-frame.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import type { KpEditorAnimationPlayerState } from
  "./animation-player-state.ts";
import type { KpEditorAnimationSurfaceAdapter } from
  "./animation-surface-adapter-registry.ts";

interface KpFiniteProductSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly relation: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly status: HTMLOutputElement;
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpFiniteProductTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, KpFiniteProductSurfaceSession>();

export const kpEditorFiniteProductSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.finite-product-expansion.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 150,
  supports(state) {
    return state.animationId === kpFiniteProductExpansionExemplarId;
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (session === undefined) {
      session = mountSurface(player, slot, state);
      sessions.set(player, session);
      player.addEventListener(
        KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeSurface(player, session!),
        { once: true }
      );
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
): KpFiniteProductSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-finite-product-stage";
  stage.dataset["kpFiniteProductStage"] = "preparing";
  stage.dataset["kpEquationMaterialVisualCache"] = "dual-revision";
  stage.dataset["kpStateRetentionProjectionId"] =
    kpFiniteProductEquivalenceFrame.projection.id;
  stage.dataset["kpStateRetentionPolicy"] =
    kpFiniteProductEquivalenceFrame.projection.policy;
  stage.setAttribute("aria-label",
    "Construct a finite product expansion as a retained equivalence");
  const frame = document.createElement("div");
  frame.className = "kp-finite-product-stage__frame";
  const sourceCell = document.createElement("div");
  sourceCell.className = "kp-finite-product-stage__cell";
  const targetCell = document.createElement("div");
  targetCell.className = "kp-finite-product-stage__cell";
  const frozenSource = document.createElement("div");
  frozenSource.className = "kp-finite-product-stage__frozen-source";
  frozenSource.dataset["kpStateRetentionOccurrenceId"] =
    kpFiniteProductEquivalenceFrameOccurrenceIds.source;
  frozenSource.innerHTML =
    kpCanonicalFiniteProductNativeEndpoints[0].nativeHtmlAndMathml;
  const relation = document.createElement("div");
  relation.className = "kp-finite-product-stage__relation";
  relation.dataset["kpStateRetentionOccurrenceId"] =
    kpFiniteProductEquivalenceFrameOccurrenceIds.relation;
  relation.innerHTML = renderLatexToHtml("=", {
    displayMode: true,
    output: "htmlAndMathml"
  });
  const createRoot = (index: 0 | 1): HTMLElement => {
    const endpoint = kpCanonicalFiniteProductNativeEndpoints[index];
    const root = document.createElement("div");
    root.className =
      `kp-finite-product-stage__endpoint ` +
      `kp-finite-product-stage__measurement ` +
      `kp-finite-product-stage__measurement--${endpoint.endpoint}`;
    root.dataset["kpFiniteProductEndpoint"] = endpoint.endpoint;
    root.dataset["kpStateRetentionOccurrenceId"] = index === 0
      ? kpFiniteProductEquivalenceFrame.projection.transitOccurrence.id
      : kpFiniteProductEquivalenceFrameOccurrenceIds.target;
    root.innerHTML = endpoint.nativeHtmlAndMathml;
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
    bindKpFiniteProductNativeEndpointOwnership({ root, endpoint });
    return root;
  };
  const roots: [HTMLElement, HTMLElement] = [createRoot(0), createRoot(1)];
  sourceCell.append(frozenSource, roots[0]);
  targetCell.append(roots[1]);
  frame.append(sourceCell, relation, targetCell);
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-finite-product-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-finite-product-stage__status";
  status.dataset["kpFiniteProductStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Finite product ready.";
  stage.append(frame, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    relation,
    endpointRoots: Object.freeze(roots),
    status,
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    disposed: false
  };
}

async function prepareSurface(
  session: KpFiniteProductSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const [source, target] = await Promise.all(
      kpCanonicalFiniteProductNativeEndpoints.map((endpoint, index) =>
        settleAndObserveKpFiniteProductNativeEndpoint({
          stage: session.stage,
          root: session.endpointRoots[index]!,
          endpoint,
          fontReadiness: session.fontReadiness
        })
      )
    );
    if (session.disposed || session.generation !== generation) return;
    const relationInkRect = measureKpNativeKatexSubtreePaintRect(
      session.stage,
      session.relation
    );
    if (relationInkRect === undefined) {
      throw new Error("Finite-product relation requires measurable native ink.");
    }
    session.transit = createKpFiniteProductTransitSession({
      sourceHandle: createKpNativeKatexRenderedEndpointHandle({
        observation: source!
      }),
      targetHandle: createKpNativeKatexRenderedEndpointHandle({
        observation: target!
      }),
      relationInkRect,
      mode: session.player.dataset["kpEditorAnimationAccessibilityMode"] ===
        "reduced-motion" ? "reduced" : "full"
    });
    session.stage.dataset["kpFiniteProductStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpFiniteProductStage"] = "failed";
    session.stage.dataset["kpFiniteProductError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root) => {
      root.style.opacity = "0";
      setAccessibleEndpoint(root, false);
    });
  }
}

function applyFrame(
  session: KpFiniteProductSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const progress =
    session.player.dataset["kpEditorAnimationAccessibilityMode"] === "static"
      ? state.progress < 0.5 ? 0 : 1
      : state.progress;
  const ownership = session.transit.apply(progress);
  const targetOwns = ownership.visualOwner === "target-native";
  session.endpointRoots.forEach((root, index) => {
    const active = targetOwns && index === 1;
    setStyleIfChanged(root.style, "opacity", active ? "1" : "0");
    setAccessibleEndpoint(root, active);
  });
  setDatasetIfChanged(session.stage, "kpFiniteProductProgress", String(progress));
  setDatasetIfChanged(session.stage, "kpFiniteProductVisualOwner",
    ownership.visualOwner);
  setTextIfChanged(session.status, progress === 0
    ? "Finite product ready."
    : progress === 1
      ? "The retained finite product equals its three-factor expansion."
      : "The retained product is generating one ordered factor at a time.");
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  const ariaHidden = active ? "false" : "true";
  if (root.getAttribute("aria-hidden") !== ariaHidden) {
    root.setAttribute("aria-hidden", ariaHidden);
  }
  if (active) {
    if (root.hasAttribute("inert")) root.removeAttribute("inert");
  } else if (!root.hasAttribute("inert")) {
    root.setAttribute("inert", "");
  }
}

function setStyleIfChanged(
  style: CSSStyleDeclaration,
  property: "opacity",
  value: string
): void {
  if (style[property] !== value) style[property] = value;
}

function setDatasetIfChanged(
  element: HTMLElement,
  key: string,
  value: string
): void {
  if (element.dataset[key] !== value) element.dataset[key] = value;
}

function setTextIfChanged(element: HTMLElement, value: string): void {
  if (element.textContent !== value) element.textContent = value;
}

function disposeSurface(
  player: HTMLElement,
  session: KpFiniteProductSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
