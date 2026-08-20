/// <reference types="vite/client" />

import {
  kpExponentialHomomorphismAnimationId
} from "../animation/exponential-homomorphism-adapter.ts";
import {
  kpCanonicalExponentialHomomorphismAuthority
} from "../semantic/exponential-homomorphism-exemplar.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  bindKpExponentialNativeEndpointOwnership,
  createKpExponentialHomomorphismNativeEndpoints,
  settleAndObserveKpExponentialNativeEndpoint,
  type KpExponentialNativeEndpoint
} from "../rendering/exponential-homomorphism-native-endpoints.ts";
import {
  createKpExponentialHomomorphismTransitSession,
  type KpExponentialHomomorphismTransitSession
} from "../rendering/exponential-homomorphism-transit-session.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  kpNativeKatexFeaturePackLoader
} from "../rendering/native-katex-feature-pack-loader.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface KpExponentialHomomorphismSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpExponentialHomomorphismTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement,
  KpExponentialHomomorphismSurfaceSession>();

const kpCanonicalExponentialHomomorphismNativeEndpoints =
  createKpExponentialHomomorphismNativeEndpoints(
    kpCanonicalExponentialHomomorphismAuthority
  );

export const kpEditorExponentialHomomorphismSurfaceAdapter = Object.freeze({
  id:
    "editor-animation-surface.exponential-homomorphism.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 133,
  supports(state) {
    return state.animationId === kpExponentialHomomorphismAnimationId;
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
): KpExponentialHomomorphismSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-exponential-homomorphism-stage";
  stage.dataset["kpExponentialHomomorphismStage"] = "preparing";
  stage.dataset["kpExponentialHomomorphismAnimationId"] =
    kpExponentialHomomorphismAnimationId;
  stage.setAttribute("aria-label", "Turn an exponential sum into a product");

  const roots: [HTMLElement, HTMLElement] = [
    createEndpointRoot(document,
      kpCanonicalExponentialHomomorphismNativeEndpoints.source, true),
    createEndpointRoot(document,
      kpCanonicalExponentialHomomorphismNativeEndpoints.target, false)
  ];
  const materialLayer = document.createElement("div");
  materialLayer.className =
    "kp-exponential-homomorphism-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-exponential-homomorphism-stage__status";
  status.dataset["kpExponentialHomomorphismStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Power with an additive exponent ready.";
  stage.append(...roots, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    endpointRoots: Object.freeze(roots) as readonly [HTMLElement, HTMLElement],
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    disposed: false
  };
}

async function prepareSurface(
  session: KpExponentialHomomorphismSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const nativeKatex = await kpNativeKatexFeaturePackLoader.load();
    if (session.disposed || session.generation !== generation) return;
    const source = await settleAndObserveKpExponentialNativeEndpoint({
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: kpCanonicalExponentialHomomorphismNativeEndpoints.source,
      fontReadiness: session.fontReadiness,
      observe: nativeKatex.observe.settleAndObserve
    });
    const target = await settleAndObserveKpExponentialNativeEndpoint({
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: kpCanonicalExponentialHomomorphismNativeEndpoints.target,
      fontReadiness: session.fontReadiness,
      observe: nativeKatex.observe.settleAndObserve
    });
    if (session.disposed || session.generation !== generation) return;
    session.transit = createKpExponentialHomomorphismTransitSession({
      authority: kpCanonicalExponentialHomomorphismAuthority,
      sourceEndpoint:
        kpCanonicalExponentialHomomorphismNativeEndpoints.source,
      targetEndpoint:
        kpCanonicalExponentialHomomorphismNativeEndpoints.target,
      source,
      target
    });
    session.stage.dataset["kpExponentialHomomorphismTrackSummary"] =
      JSON.stringify(session.transit.canonical.session.tracks.map((track) => ({
        id: track.id,
        lifecycle: track.lifecycle,
        timingGroupId: track.timingGroupId,
        motionAxisConstraint: track.motionAxisConstraint
      })));
    session.stage.dataset["kpExponentialHomomorphismStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpExponentialHomomorphismStage"] = "failed";
    session.stage.dataset["kpExponentialHomomorphismError"] =
      error instanceof Error ? error.message : String(error);
    showEndpoint(session, 0);
  }
}

function applyFrame(
  session: KpExponentialHomomorphismSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  const accessibilityMode = session.player.dataset[
    "kpEditorAnimationAccessibilityMode"
  ] ?? "full-motion";
  const reduced = accessibilityMode === "reduced-motion" ||
    accessibilityMode === "static";
  const progress = reduced ? (state.progress < 0.5 ? 0 : 1) : state.progress;
  const ownership = session.transit.apply(progress);
  setAccessibleEndpoint(
    session.endpointRoots[ownership.visualOwner === "source-native" ? 0 : 1],
    true
  );
  session.stage.dataset["kpExponentialHomomorphismProgress"] = String(progress);
  session.stage.dataset["kpExponentialHomomorphismVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-exponential-homomorphism-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? "Power with an additive exponent ready."
      : progress === 1
        ? "The additive exponent is now a product of powers."
        : "The exponent payloads persist while the base derives two powers.";
  }
}

function createEndpointRoot(
  document: Document,
  endpoint: KpExponentialNativeEndpoint,
  active: boolean
): HTMLElement {
  const root = document.createElement("div");
  root.className = "kp-exponential-homomorphism-stage__endpoint";
  root.dataset["kpExponentialHomomorphismEndpoint"] = endpoint.endpoint;
  root.innerHTML = endpoint.nativeHtmlAndMathml;
  root.style.opacity = active ? "1" : "0";
  setAccessibleEndpoint(root, active);
  bindKpExponentialNativeEndpointOwnership({ root, endpoint });
  return root;
}

function showEndpoint(
  session: KpExponentialHomomorphismSurfaceSession,
  activeIndex: 0 | 1
): void {
  session.endpointRoots.forEach((root, index) => {
    root.style.opacity = index === activeIndex ? "1" : "0";
    setAccessibleEndpoint(root, index === activeIndex);
  });
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpExponentialHomomorphismSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
