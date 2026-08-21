/// <reference types="vite/client" />

import {
  kpFiniteSumExpansionExemplarId
} from "../animation/finite-sum-expansion-exemplar.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  bindKpFiniteSumNativeEndpointOwnership,
  kpCanonicalFiniteSumNativeEndpoints,
  settleAndObserveKpFiniteSumNativeEndpoint
} from "../rendering/finite-sum-native-endpoints.ts";
import {
  createKpNativeKatexRenderedEndpointHandle
} from "../rendering/native-katex-rendered-scene.ts";
import {
  createKpFiniteSumTransitSession,
  type KpFiniteSumTransitSession
} from "../rendering/finite-sum-transit-session.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface KpFiniteSumSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpFiniteSumTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, KpFiniteSumSurfaceSession>();

export const kpEditorFiniteSumSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.finite-sum-expansion.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 150,
  supports(state) {
    return state.animationId === kpFiniteSumExpansionExemplarId;
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
): KpFiniteSumSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-finite-sum-stage";
  stage.dataset["kpFiniteSumStage"] = "preparing";
  stage.setAttribute("aria-label", "Expand a finite sum");
  const createRoot = (index: 0 | 1): HTMLElement => {
    const endpoint = kpCanonicalFiniteSumNativeEndpoints[index];
    const root = document.createElement("div");
    root.className = "kp-finite-sum-stage__endpoint";
    root.dataset["kpFiniteSumEndpoint"] = endpoint.endpoint;
    root.innerHTML = endpoint.nativeHtmlAndMathml;
    root.style.opacity = index === 0 ? "1" : "0";
    setAccessibleEndpoint(root, index === 0);
    bindKpFiniteSumNativeEndpointOwnership({ root, endpoint });
    return root;
  };
  const roots: [HTMLElement, HTMLElement] = [createRoot(0), createRoot(1)];
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-finite-sum-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-finite-sum-stage__status";
  status.dataset["kpFiniteSumStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Finite sum ready.";
  stage.append(...roots, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    endpointRoots: Object.freeze(roots),
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    disposed: false
  };
}

async function prepareSurface(
  session: KpFiniteSumSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const [source, target] = await Promise.all(
      kpCanonicalFiniteSumNativeEndpoints.map((endpoint, index) =>
        settleAndObserveKpFiniteSumNativeEndpoint({
          stage: session.stage,
          root: session.endpointRoots[index]!,
          endpoint,
          fontReadiness: session.fontReadiness
        })
      )
    );
    if (session.disposed || session.generation !== generation) return;
    const accessibility =
      session.player.dataset["kpEditorAnimationAccessibilityMode"];
    session.transit = createKpFiniteSumTransitSession({
      sourceHandle: createKpNativeKatexRenderedEndpointHandle({
        observation: source!
      }),
      targetHandle: createKpNativeKatexRenderedEndpointHandle({
        observation: target!
      }),
      mode: accessibility === "reduced-motion" ? "reduced" : "full"
    });
    session.stage.dataset["kpFiniteSumStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpFiniteSumStage"] = "failed";
    session.stage.dataset["kpFiniteSumError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function applyFrame(
  session: KpFiniteSumSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const accessibility =
    session.player.dataset["kpEditorAnimationAccessibilityMode"];
  const progress = accessibility === "static"
    ? state.progress < 0.5 ? 0 : 1
    : state.progress;
  session.endpointRoots.forEach((root) => setAccessibleEndpoint(root, false));
  const ownership = session.transit.apply(progress);
  const accessibleIndex = ownership.visualOwner === "source-native" ? 0 : 1;
  setAccessibleEndpoint(session.endpointRoots[accessibleIndex]!, true);
  session.stage.dataset["kpFiniteSumProgress"] = String(progress);
  session.stage.dataset["kpFiniteSumVisualOwner"] = ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-finite-sum-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? "Finite sum ready."
      : progress === 1
        ? "The three ordered terms are expanded."
        : "Instantiating the sum body in order.";
  }
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpFiniteSumSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
