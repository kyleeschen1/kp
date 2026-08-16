/// <reference types="vite/client" />

import {
  kpLogProductAnimationId
} from "../animation/log-product-adapter.ts";
import {
  sampleKpSemanticMotionChoreography
} from "../domain-ir/public-api.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  bindKpLogProductNativeEndpointOwnership,
  kpCanonicalLogProductNativeEndpoints,
  settleAndObserveKpLogProductNativeEndpoint
} from "../rendering/log-product-native-endpoints.ts";
import {
  createKpLogProductTransitSession,
  type KpLogProductTransitSession
} from "../rendering/log-product-transit-session.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  kpCanonicalCompiledLogProductSemanticMotion
} from "../semantic/log-product-semantic-motion.ts";
import {
  kpCanonicalCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface KpLogProductSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpLogProductTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, KpLogProductSurfaceSession>();

export const kpEditorLogProductSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.log-product.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 132,
  supports(state) {
    return state.animationId === kpLogProductAnimationId;
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
): KpLogProductSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-log-product-stage";
  stage.dataset["kpLogProductStage"] = "preparing";
  stage.dataset["kpLogProductSemanticMotionChoreographyId"] =
    kpCanonicalCompiledLogProductSemanticMotion.id;
  stage.dataset["kpLogProductSemanticMotionRecipeId"] =
    kpCanonicalCompiledLogProductSemanticMotion.recipeId;
  stage.setAttribute("aria-label", "Expand a logarithm of a product");

  const createRoot = (
    endpoint: typeof kpCanonicalLogProductNativeEndpoints[number],
    active: boolean
  ): HTMLElement => {
    const root = document.createElement("div");
    root.className = "kp-log-product-stage__endpoint";
    root.dataset["kpLogProductEndpointStateId"] = endpoint.stateId;
    root.innerHTML = endpoint.nativeHtmlAndMathml;
    root.style.opacity = active ? "1" : "0";
    setAccessibleEndpoint(root, active);
    bindKpLogProductNativeEndpointOwnership({ root, endpoint });
    return root;
  };
  const roots: [HTMLElement, HTMLElement] = [
    createRoot(kpCanonicalLogProductNativeEndpoints[0]!, true),
    createRoot(kpCanonicalLogProductNativeEndpoints[1]!, false)
  ];
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-log-product-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-log-product-stage__status";
  status.dataset["kpLogProductStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Logarithm of a product ready.";
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
  session: KpLogProductSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const source = await settleAndObserveKpLogProductNativeEndpoint({
      endpointSide: "source",
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: kpCanonicalLogProductNativeEndpoints[0]!,
      fontReadiness: session.fontReadiness
    });
    const target = await settleAndObserveKpLogProductNativeEndpoint({
      endpointSide: "target",
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: kpCanonicalLogProductNativeEndpoints[1]!,
      fontReadiness: session.fontReadiness
    });
    if (session.disposed || session.generation !== generation) return;
    session.transit = createKpLogProductTransitSession({
      operation: kpCanonicalCompiledLogProductOperation,
      semanticMotion: kpCanonicalCompiledLogProductSemanticMotion,
      sourceEndpoint: kpCanonicalLogProductNativeEndpoints[0]!,
      targetEndpoint: kpCanonicalLogProductNativeEndpoints[1]!,
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
    session.stage.dataset["kpLogProductTrackSummary"] = JSON.stringify(
      session.transit.canonical.session.tracks.map((track) => ({
        id: track.id,
        lifecycle: track.lifecycle,
        sourceEntityId: track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId),
        targetEntityId: track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId),
        semanticMotionUnitId: track.semanticMotionUnitId,
        timingGroupId: track.timingGroupId
      }))
    );
    session.stage.dataset["kpLogProductStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpLogProductStage"] = "failed";
    session.stage.dataset["kpLogProductError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function applyFrame(
  session: KpLogProductSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const accessibilityMode =
    session.player.dataset["kpEditorAnimationAccessibilityMode"] ??
    "full-motion";
  const frame = sampleKpSemanticMotionChoreography({
    choreography: kpCanonicalCompiledLogProductSemanticMotion,
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
  session.stage.dataset["kpLogProductProgress"] = String(frame.semanticProgress);
  session.stage.dataset["kpLogProductVisualOwner"] = ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-log-product-status]"
  );
  if (status !== null) {
    status.textContent = frame.semanticProgress === 0
      ? "Logarithm of a product ready."
      : frame.semanticProgress === 1
        ? "The product is now a sum of logarithms."
        : "One logarithm is becoming two while x and y keep identity.";
  }
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpLogProductSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
