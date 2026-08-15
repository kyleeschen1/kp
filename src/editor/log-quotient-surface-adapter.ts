/// <reference types="vite/client" />

import {
  kpLogQuotientAnimationId
} from "../animation/log-quotient-adapter.ts";
import {
  kpCanonicalLogQuotientHomomorphicFusionChoreography
} from "../animation/log-quotient-homomorphic-fusion.ts";
import {
  sampleKpLogQuotientFrame
} from "../animation/log-quotient-timeline.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  bindKpLogQuotientNativeEndpointOwnership,
  kpCanonicalLogQuotientNativeEndpoints,
  settleAndObserveKpLogQuotientNativeEndpoint
} from "../rendering/log-quotient-native-endpoints.ts";
import {
  createKpLogQuotientTransitSession,
  type KpLogQuotientTransitSession
} from "../rendering/log-quotient-transit-session.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  kpCanonicalCompiledLogQuotientOperation
} from "../semantic/log-quotient-transformation-compiler.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface KpLogQuotientSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpLogQuotientTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, KpLogQuotientSurfaceSession>();

export const kpEditorLogQuotientSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.log-quotient.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 131,
  supports(state) {
    return state.animationId === kpLogQuotientAnimationId;
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
): KpLogQuotientSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-log-quotient-stage";
  stage.dataset["kpLogQuotientStage"] = "preparing";
  stage.setAttribute("aria-label", "Combine a difference of logarithms");

  const createRoot = (
    endpoint: typeof kpCanonicalLogQuotientNativeEndpoints[number],
    active: boolean
  ): HTMLElement => {
    const root = document.createElement("div");
    root.className = "kp-log-quotient-stage__endpoint";
    root.dataset["kpLogQuotientEndpointStateId"] = endpoint.stateId;
    root.innerHTML = endpoint.nativeHtmlAndMathml;
    root.style.opacity = active ? "1" : "0";
    setAccessibleEndpoint(root, active);
    bindKpLogQuotientNativeEndpointOwnership({ root, endpoint });
    return root;
  };
  const roots: [HTMLElement, HTMLElement] = [
    createRoot(kpCanonicalLogQuotientNativeEndpoints[0]!, true),
    createRoot(kpCanonicalLogQuotientNativeEndpoints[1]!, false)
  ];
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-log-quotient-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-log-quotient-stage__status";
  status.dataset["kpLogQuotientStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Difference of logarithms ready.";
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
  session: KpLogQuotientSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const source = await settleAndObserveKpLogQuotientNativeEndpoint({
      endpointSide: "source",
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: kpCanonicalLogQuotientNativeEndpoints[0]!,
      fontReadiness: session.fontReadiness
    });
    const target = await settleAndObserveKpLogQuotientNativeEndpoint({
      endpointSide: "target",
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: kpCanonicalLogQuotientNativeEndpoints[1]!,
      fontReadiness: session.fontReadiness
    });
    if (session.disposed || session.generation !== generation) return;
    session.transit = createKpLogQuotientTransitSession({
      operation: kpCanonicalCompiledLogQuotientOperation,
      sourceEndpoint: kpCanonicalLogQuotientNativeEndpoints[0]!,
      targetEndpoint: kpCanonicalLogQuotientNativeEndpoints[1]!,
      source,
      target,
      operationChoreography:
        kpCanonicalLogQuotientHomomorphicFusionChoreography
    });
    const sourceEntities = new Map(source.atoms.map((atom) => [
      atom.id,
      atom.semanticEntityId
    ]));
    const targetEntities = new Map(target.atoms.map((atom) => [
      atom.id,
      atom.semanticEntityId
    ]));
    session.stage.dataset["kpLogQuotientTrackSummary"] = JSON.stringify(
      session.transit.canonical.session.tracks.map((track) => ({
        id: track.id,
        lifecycle: track.lifecycle,
        sourceAtomId: track.sourceAtomId,
        targetAtomId: track.targetAtomId,
        sourceEntityId: track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId),
        targetEntityId: track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId),
        motionPathVariant: track.motionPath?.variant,
        motionAxisConstraint: track.motionAxisConstraint,
        timingGroupId: track.timingGroupId
      }))
    );
    session.stage.dataset["kpLogQuotientStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpLogQuotientStage"] = "failed";
    session.stage.dataset["kpLogQuotientError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function applyFrame(
  session: KpLogQuotientSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const accessibilityMode =
    session.player.dataset["kpEditorAnimationAccessibilityMode"] ??
    "full-motion";
  const frame = sampleKpLogQuotientFrame({
    progress: state.progress,
    direction: state.direction,
    reducedMotion:
      accessibilityMode === "reduced-motion" ||
      accessibilityMode === "static"
  });
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  const ownership = session.transit.apply(frame.semanticProgress);
  const accessibleIndex = ownership.visualOwner === "source-native" ? 0 : 1;
  setAccessibleEndpoint(session.endpointRoots[accessibleIndex], true);
  session.stage.dataset["kpLogQuotientProgress"] =
    String(frame.semanticProgress);
  session.stage.dataset["kpLogQuotientVisualOwner"] = ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-log-quotient-status]"
  );
  if (status !== null) {
    status.textContent = frame.semanticProgress === 0
      ? "Difference of logarithms ready."
      : frame.semanticProgress === 1
        ? "One logarithm now contains the quotient."
        : "Moving x and y into quotient positions.";
  }
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpLogQuotientSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
