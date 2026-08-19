/// <reference types="vite/client" />

import { kpFractionEquivalenceExemplarId } from
  "../animation/fraction-equivalence-exemplar.ts";
import { createKpEquationFontReadiness } from
  "../rendering/equation-font-readiness.ts";
import { syncKpEquationMaterialLayer } from
  "../rendering/equation-material-layer-dom.ts";
import {
  bindKpFractionEquivalenceNativeEndpointOwnership,
  kpCanonicalFractionEquivalenceNativeEndpoints,
  settleAndObserveKpFractionEquivalenceNativeEndpoint
} from "../rendering/fraction-equivalence-native-endpoints.ts";
import {
  createKpFractionEquivalenceTransitSession,
  type KpFractionEquivalenceTransitSession
} from "../rendering/fraction-equivalence-transit-session.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import type { KpEditorAnimationPlayerState } from
  "./animation-player-state.ts";
import type { KpEditorAnimationSurfaceAdapter } from
  "./animation-surface-adapter-registry.ts";

interface KpFractionEquivalenceSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpFractionEquivalenceTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement,
  KpFractionEquivalenceSurfaceSession>();

export const kpEditorFractionEquivalenceSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.fraction-equivalence.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 133,
  supports(state) {
    return state.animationId === kpFractionEquivalenceExemplarId;
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
): KpFractionEquivalenceSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-fraction-equivalence-stage";
  stage.dataset["kpFractionEquivalenceStage"] = "preparing";
  stage.setAttribute("aria-label", "Equivalent fraction scaling");
  const createRoot = (
    endpoint: typeof kpCanonicalFractionEquivalenceNativeEndpoints[number],
    active: boolean
  ): HTMLElement => {
    const root = document.createElement("div");
    root.className = "kp-fraction-equivalence-stage__endpoint";
    root.dataset["kpFractionEquivalenceEndpointStateId"] = endpoint.stateId;
    root.innerHTML = endpoint.nativeHtmlAndMathml;
    root.style.opacity = active ? "1" : "0";
    setAccessibleEndpoint(root, active);
    bindKpFractionEquivalenceNativeEndpointOwnership({ root, endpoint });
    return root;
  };
  const roots: [HTMLElement, HTMLElement] = [
    createRoot(kpCanonicalFractionEquivalenceNativeEndpoints[0]!, true),
    createRoot(kpCanonicalFractionEquivalenceNativeEndpoints[1]!, false)
  ];
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-fraction-equivalence-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-fraction-equivalence-stage__status";
  status.dataset["kpFractionEquivalenceStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "A over b with shared factor two ready.";
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
  session: KpFractionEquivalenceSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const source = await settleAndObserveKpFractionEquivalenceNativeEndpoint({
      endpointSide: "source",
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: kpCanonicalFractionEquivalenceNativeEndpoints[0]!,
      fontReadiness: session.fontReadiness
    });
    const target = await settleAndObserveKpFractionEquivalenceNativeEndpoint({
      endpointSide: "target",
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: kpCanonicalFractionEquivalenceNativeEndpoints[1]!,
      fontReadiness: session.fontReadiness
    });
    if (session.disposed || session.generation !== generation) return;
    session.transit = createKpFractionEquivalenceTransitSession({
      source,
      target
    });
    const sourceEntities = new Map(source.atoms.map((atom) => [
      atom.id,
      atom.semanticEntityId
    ]));
    const targetEntities = new Map(target.atoms.map((atom) => [
      atom.id,
      atom.semanticEntityId
    ]));
    session.stage.dataset["kpFractionEquivalenceTrackSummary"] =
      JSON.stringify(session.transit.canonical.session.tracks.map((track) => ({
        id: track.id,
        lifecycle: track.lifecycle,
        sourceEntityId: track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId),
        targetEntityId: track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId),
        motionPathVariant: track.motionPath?.variant
      })));
    session.stage.dataset["kpFractionEquivalenceStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpFractionEquivalenceStage"] = "failed";
    session.stage.dataset["kpFractionEquivalenceError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function applyFrame(
  session: KpFractionEquivalenceSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const accessibilityMode =
    session.player.dataset["kpEditorAnimationAccessibilityMode"] ??
    "full-motion";
  const progress = accessibilityMode === "reduced-motion" ||
      accessibilityMode === "static"
    ? state.progress < 0.5 ? 0 : 1
    : state.progress;
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  const ownership = session.transit.apply(progress);
  const accessibleIndex = ownership.visualOwner === "source-native" ? 0 : 1;
  setAccessibleEndpoint(session.endpointRoots[accessibleIndex], true);
  session.stage.dataset["kpFractionEquivalenceProgress"] = String(progress);
  session.stage.dataset["kpFractionEquivalenceVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-fraction-equivalence-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? "A over b with shared factor two ready."
      : progress === 1
        ? "Two a over two b: an equivalent fraction."
        : "Copying the same nonzero factor into numerator and denominator.";
  }
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpFractionEquivalenceSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
