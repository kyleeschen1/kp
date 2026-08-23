/// <reference types="vite/client" />

import {
  isKpLogProductAnimationId
} from "../semantic/log-product-ids.ts";
import {
  projectKpLogProductMaterialPresentationMode
} from "../animation/log-product-material-depth-mode.ts";
import {
  sampleKpLogProductMaterialDepthChoreography
} from "../animation/log-product-material-depth-choreography.ts";
import {
  sampleKpSemanticMotionChoreography,
  type KpCompiledSemanticMotionChoreography
} from "../domain-ir/public-api.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  bindKpLogProductNativeEndpointOwnership,
  kpLogProductNativeEndpointSets,
  settleAndObserveKpLogProductNativeEndpoint,
  type KpLogProductNativeEndpoint
} from "../rendering/log-product-native-endpoints.ts";
import {
  createKpLogProductTransitSession,
  type KpLogProductTransitSession
} from "../rendering/log-product-transit-session.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  applyKpLogProductMaterialDepthToDom,
  resolveKpLogProductDepthModeForVisualOwner
} from "../rendering/log-product-material-depth-dom.ts";
import {
  kpLogProductSemanticMotionBundles
} from "../semantic/log-product-semantic-motion.ts";
import {
  type KpCompiledLogProductOperation
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
  readonly operation: KpCompiledLogProductOperation;
  readonly semanticMotion: KpCompiledSemanticMotionChoreography;
  readonly endpoints: readonly [
    KpLogProductNativeEndpoint,
    KpLogProductNativeEndpoint
  ];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  resizeObserver?: ResizeObserver | undefined;
  observedGeometryKey?: string | undefined;
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
    return isKpLogProductAnimationId(state.animationId);
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    let created = false;
    if (session === undefined) {
      session = mountSurface(player, slot, state);
      sessions.set(player, session);
      created = true;
      player.addEventListener(
        KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeSurface(player, session!),
        { once: true }
      );
    }
    session.pendingState = state;
    const typographyChanged = syncMaterialPresentationMode(session);
    if (created || typographyChanged) {
      session.transit?.retire();
      session.transit = undefined;
      if (!created) {
        // Computed-style clones intentionally freeze their source typography.
        // A scale-mode switch therefore needs fresh owners, not reused paint.
        syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
      }
      session.stage.dataset["kpLogProductStage"] = "preparing";
      const generation = ++session.generation;
      void prepareSurface(session, generation, false);
    }
    if (session.transit !== undefined) applyFrame(session, state);
  }
} satisfies KpEditorAnimationSurfaceAdapter);

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState
): KpLogProductSurfaceSession {
  const document = player.ownerDocument;
  const runtime = runtimeForAnimation(state.animationId);
  const stage = document.createElement("section");
  stage.className = "kp-log-product-stage";
  stage.dataset["kpLogProductStage"] = "preparing";
  stage.dataset["kpLogProductGeometryState"] = "preparing";
  stage.dataset["kpLogProductGeometryRevision"] = "0";
  stage.dataset["kpLogProductSemanticMotionChoreographyId"] =
    runtime.semanticMotion.id;
  stage.dataset["kpLogProductSemanticMotionRecipeId"] =
    runtime.semanticMotion.recipeId;
  stage.setAttribute("aria-label", "Expand a logarithm of a product");

  const createRoot = (
    endpoint: KpLogProductNativeEndpoint,
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
    createRoot(runtime.endpoints[0], true),
    createRoot(runtime.endpoints[1], false)
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
  const session: KpLogProductSurfaceSession = {
    player,
    stage,
    endpointRoots: Object.freeze(roots) as readonly [HTMLElement, HTMLElement],
    operation: runtime.operation,
    semanticMotion: runtime.semanticMotion,
    endpoints: runtime.endpoints,
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    disposed: false
  };
  observeSurfaceGeometry(session);
  return session;
}

function syncMaterialPresentationMode(
  session: KpLogProductSurfaceSession
): boolean {
  const mode = projectKpLogProductMaterialPresentationMode(
    session.player.dataset["kpEditorAnimationFocusExperiment"]
  );
  const typographyChanged =
    session.stage.dataset["kpLogProductTypography"] !== mode.typography;
  session.stage.dataset["kpLogProductMaterialDepthMode"] = mode.depthMode;
  session.stage.dataset["kpLogProductTypography"] = mode.typography;
  session.stage.dataset["kpLogProductMaterialActive"] = String(mode.active);
  return typographyChanged;
}

async function prepareSurface(
  session: KpLogProductSurfaceSession,
  generation: number,
  preservePaint: boolean
): Promise<void> {
  try {
    const source = await settleAndObserveKpLogProductNativeEndpoint({
      endpointSide: "source",
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: session.endpoints[0],
      fontReadiness: session.fontReadiness
    });
    const target = await settleAndObserveKpLogProductNativeEndpoint({
      endpointSide: "target",
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: session.endpoints[1],
      fontReadiness: session.fontReadiness
    });
    if (session.disposed || session.generation !== generation) return;
    const replacement = createKpLogProductTransitSession({
      operation: session.operation,
      semanticMotion: session.semanticMotion,
      sourceEndpoint: session.endpoints[0],
      targetEndpoint: session.endpoints[1],
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
    const visualAtoms = new Map(
      [...source.atoms, ...target.atoms].map((atom) => [atom.id, atom] as const)
    );
    session.stage.dataset["kpLogProductTrackSummary"] = JSON.stringify(
      replacement.canonical.session.tracks.map((track) => {
        const visualAtom = visualAtoms.get(track.visualAtomId);
        return {
          id: track.id,
          lifecycle: track.lifecycle,
          sourceEntityId: track.sourceAtomId === undefined
            ? undefined
            : sourceEntities.get(track.sourceAtomId),
          targetEntityId: track.targetAtomId === undefined
            ? undefined
            : targetEntities.get(track.targetAtomId),
          visualEntityId: visualAtom?.semanticEntityId,
          visualKey: visualAtom?.visualKey,
          semanticMotionUnitId: track.semanticMotionUnitId,
          timingGroupId: track.timingGroupId,
          motionAxisConstraint: track.motionAxisConstraint,
          motionPathVariant: track.motionPath?.variant
        };
      })
    );
    const previous = session.transit;
    session.transit = replacement;
    try {
      applyFrame(session, session.pendingState);
    } catch (error: unknown) {
      session.transit = previous;
      replacement.retire();
      throw error;
    }
    previous?.retire();
    session.stage.dataset["kpLogProductStage"] = "ready";
    session.stage.dataset["kpLogProductGeometryState"] = "ready";
    session.stage.dataset["kpLogProductGeometryRevision"] = String(
      Number(session.stage.dataset["kpLogProductGeometryRevision"] ?? "0") + 1
    );
    delete session.stage.dataset["kpLogProductError"];
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    if (preservePaint && session.transit !== undefined) {
      session.stage.dataset["kpLogProductGeometryState"] = "stale";
      session.stage.dataset["kpLogProductError"] =
        error instanceof Error ? error.message : String(error);
      applyFrame(session, session.pendingState);
      return;
    }
    session.stage.dataset["kpLogProductStage"] = "failed";
    session.stage.dataset["kpLogProductError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function observeSurfaceGeometry(session: KpLogProductSurfaceSession): void {
  const view = session.stage.ownerDocument.defaultView;
  const ResizeObserverConstructor = view?.ResizeObserver;
  if (
    view === null ||
    view === undefined ||
    ResizeObserverConstructor === undefined
  ) {
    return;
  }
  session.resizeObserver = new ResizeObserverConstructor((entries) => {
    const entry = entries.find(({ target }) => target === session.stage);
    if (entry === undefined || session.disposed) return;
    const geometryKey = [
      Math.round(entry.contentRect.width * 2) / 2,
      Math.round(entry.contentRect.height * 2) / 2
    ].join("x");
    if (session.observedGeometryKey === undefined) {
      session.observedGeometryKey = geometryKey;
      return;
    }
    if (session.observedGeometryKey === geometryKey) return;
    session.observedGeometryKey = geometryKey;
    // ResizeObserver is already layout-batched. A resize is a renderer
    // revision, not an animation event, so it must not create another clock.
    // Current owners remain painted until replacement geometry is complete.
    session.stage.dataset["kpLogProductGeometryState"] = "preparing";
    const generation = ++session.generation;
    void prepareSurface(session, generation, true);
  });
  session.resizeObserver.observe(session.stage);
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
    choreography: session.semanticMotion,
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
  const materialPoseProgress = Number(
    session.stage.dataset["kpNativeKatexPoseProgress"] ?? "0"
  );
  session.stage.dataset["kpLogProductMaterialGeometryLanded"] = String(
    ownership.visualOwner !== "source-native" && materialPoseProgress >= 1
  );
  const materialMode = projectKpLogProductMaterialPresentationMode(
    session.player.dataset["kpEditorAnimationFocusExperiment"]
  );
  applyKpLogProductMaterialDepthToDom({
    stage: session.stage,
    mode: resolveKpLogProductDepthModeForVisualOwner(
      materialMode.depthMode,
      ownership.visualOwner
    ),
    poseByRoleId: sampleKpLogProductMaterialDepthChoreography({
      mode: materialMode.depthMode,
      choreography: frame
    })
  });
  const accessibleIndex = ownership.visualOwner === "source-native" ? 0 : 1;
  setAccessibleEndpoint(session.endpointRoots[accessibleIndex], true);
  session.stage.dataset["kpLogProductProgress"] = String(frame.semanticProgress);
  session.stage.dataset["kpLogProductVisualOwner"] = ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-log-product-status]"
  );
  if (status !== null) {
    const factorNames = session.operation.contract.family.factors.map(
      ({ name }) => name
    );
    status.textContent = frame.semanticProgress === 0
      ? "Logarithm of a product ready."
      : frame.semanticProgress === 1
        ? "The product is now a sum of logarithms."
        : `One logarithm is becoming ${factorNames.length} while ` +
          `${factorNames.join(", ")} keep identity.`;
  }
}

function runtimeForAnimation(animationId: string) {
  const semantic = kpLogProductSemanticMotionBundles.find(
    ({ operation }) => operation.contract.animationId === animationId
  );
  const endpoints = kpLogProductNativeEndpointSets.find(
    (entry) => entry.animationId === animationId
  );
  if (semantic === undefined || endpoints === undefined) {
    throw new Error(`No compiled log-product runtime exists for ${animationId}.`);
  }
  return Object.freeze({
    operation: semantic.operation,
    semanticMotion: semantic.choreography,
    endpoints: endpoints.endpoints
  });
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
  session.resizeObserver?.disconnect();
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
