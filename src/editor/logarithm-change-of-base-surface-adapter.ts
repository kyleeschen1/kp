/// <reference types="vite/client" />

import {
  createKpLogarithmChangeOfBaseExemplarAsset,
  kpLogarithmChangeOfBaseExemplarId
} from "../animation/logarithm-change-of-base-exemplar.ts";
import {
  compileKpLogarithmChangeOfBaseMigrationV2
} from "../domain-ir/logarithm-change-of-base-migration-v2.ts";
import type {
  KpEquationAssetMigrationV2
} from "../domain-ir/equation-asset-migration-v2.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import { sampleKpSynchronizedModelProjectionProgress } from "../animation/synchronized-model-projection.ts";
import {
  bindKpLogarithmChangeOfBaseNativeEndpointOwnership,
  createKpLogarithmChangeOfBaseNativeEndpoints,
  settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint
} from "../rendering/logarithm-change-of-base-native-endpoints.ts";
import {
  createKpLogarithmChangeOfBaseTransitSession,
  type KpLogarithmChangeOfBaseTransitSession
} from "../rendering/logarithm-change-of-base-transit-session.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

import { kpCanonicalLogarithmChangeOfBase } from "../semantic/logarithm-change-of-base.ts";
import { publishKpEditorAnimationSurfaceReadiness } from "./animation-surface-readiness.ts";

interface KpLogarithmChangeOfBaseSurfaceSession {
  readonly semantic: typeof kpCanonicalLogarithmChangeOfBase;
  readonly endpoints: ReturnType<typeof createKpLogarithmChangeOfBaseNativeEndpoints>;
  readonly governance: KpEquationAssetMigrationV2;
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  resizeObserver?: ResizeObserver | undefined;
  observedGeometryKey?: string | undefined;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpLogarithmChangeOfBaseTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement,
  KpLogarithmChangeOfBaseSurfaceSession>();
export function createKpEditorLogarithmChangeOfBaseSurfaceAdapter(semantic = kpCanonicalLogarithmChangeOfBase) {
return Object.freeze({
  id: "editor-animation-surface.logarithm-change-of-base.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 132,
  supports(state) {
    return state.animationId === kpLogarithmChangeOfBaseExemplarId;
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (session === undefined) {
      session = mountSurface(player, slot, state, semantic);
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
}
export const kpEditorLogarithmChangeOfBaseSurfaceAdapter = createKpEditorLogarithmChangeOfBaseSurfaceAdapter();

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState,
  semantic: typeof kpCanonicalLogarithmChangeOfBase
): KpLogarithmChangeOfBaseSurfaceSession {
  const endpoints = createKpLogarithmChangeOfBaseNativeEndpoints(semantic);
  const governance = compileKpLogarithmChangeOfBaseMigrationV2(createKpLogarithmChangeOfBaseExemplarAsset(semantic), semantic);
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-logarithm-change-of-base-stage";
  stage.dataset["kpLogarithmChangeOfBaseStage"] = "preparing";
  stage.dataset["kpEquationPresentationPlanId"] =
    governance.presentationPlan.id;
  stage.dataset["kpLogarithmChangeOfBaseSemanticId"] = semantic.id;
  stage.setAttribute("aria-label", "Change logarithm base");
  const createRoot = (
    endpoint: typeof endpoints[number],
    active: boolean
  ): HTMLElement => {
    const root = document.createElement("div");
    root.className = "kp-logarithm-change-of-base-stage__endpoint";
    root.dataset["kpLogarithmChangeOfBaseEndpointStateId"] = endpoint.stateId;
    root.innerHTML = endpoint.nativeHtmlAndMathml;
    root.style.opacity = active ? "1" : "0";
    setAccessibleEndpoint(root, active);
    bindKpLogarithmChangeOfBaseNativeEndpointOwnership({ root, endpoint });
    return root;
  };
  const roots: [HTMLElement, HTMLElement] = [
    createRoot(endpoints[0]!, true),
    createRoot(endpoints[1]!, false)
  ];
  const materialLayer = document.createElement("div");
  materialLayer.className =
    "kp-logarithm-change-of-base-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-logarithm-change-of-base-stage__status";
  status.dataset["kpLogarithmChangeOfBaseStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = endpoints[0]!.accessibleText;
  stage.append(...roots, materialLayer, status);
  slot.replaceChildren(stage);
  const session: KpLogarithmChangeOfBaseSurfaceSession = {
    governance, semantic, endpoints,
    player,
    stage,
    endpointRoots: Object.freeze(roots) as readonly [HTMLElement, HTMLElement],
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    disposed: false
  };
  observeSurfaceGeometry(session);
  publishKpEditorAnimationSurfaceReadiness({ player, readiness: "preparing" });
  return session;
}

async function prepareSurface(
  session: KpLogarithmChangeOfBaseSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const source = await settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint({
      endpointSide: "source",
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: session.endpoints[0]!,
      fontReadiness: session.fontReadiness
    });
    const target = await settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint({
      endpointSide: "target",
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: session.endpoints[1]!,
      fontReadiness: session.fontReadiness
    });
    if (session.disposed || session.generation !== generation) return;
    const previous = session.transit;
    // The canonical factory calibrates native handoff during construction.
    // Retire frozen typography before that calibration, not only before the
    // first public frame. Replacement remains one synchronous paint commit.
    if (previous !== undefined) syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
    const replacement = createKpLogarithmChangeOfBaseTransitSession({
      source,
      target,
      semantic: session.semantic
    });
    const sourceEntities = new Map(source.atoms.map((atom) => [
      atom.id,
      atom.semanticEntityId
    ]));
    const targetEntities = new Map(target.atoms.map((atom) => [
      atom.id,
      atom.semanticEntityId
    ]));
    session.stage.dataset["kpLogarithmChangeOfBaseTrackSummary"] =
      JSON.stringify(replacement.canonical.session.tracks.map((track) => ({
        id: track.id,
        lifecycle: track.lifecycle,
        sourceEntityId: track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId),
        targetEntityId: track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId),
        timingGroupId: track.timingGroupId,
        metricInterpolation: track.motionMetrics !== true
          ? "default"
          : "semantic-role-change"
      })));
    session.transit = replacement;
    try { applyFrame(session, session.pendingState); }
    catch (error) { session.transit = previous; replacement.retire(); throw error; }
    previous?.retire();
    session.stage.dataset["kpLogarithmChangeOfBaseStage"] = "ready";
    session.stage.dataset["kpLogarithmChangeOfBaseGeometryState"] = "ready";
    session.stage.dataset["kpLogarithmChangeOfBaseGeometryRevision"] = String(generation);
    delete session.stage.dataset["kpLogarithmChangeOfBaseError"];
    publishKpEditorAnimationSurfaceReadiness({ player: session.player, readiness: "ready" });
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpLogarithmChangeOfBaseStage"] = "failed";
    session.stage.dataset["kpLogarithmChangeOfBaseError"] =
      error instanceof Error ? error.message : String(error);
    publishKpEditorAnimationSurfaceReadiness({ player: session.player, readiness: "failed", error: String(error) });
    if (session.transit !== undefined) {
      session.stage.dataset["kpLogarithmChangeOfBaseGeometryState"] = "stale";
      applyFrame(session, session.pendingState);
      return;
    }
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function observeSurfaceGeometry(session: KpLogarithmChangeOfBaseSurfaceSession): void {
  const Observer = session.stage.ownerDocument.defaultView?.ResizeObserver;
  if (Observer === undefined) return;
  session.resizeObserver = new Observer(entries => {
    const entry = entries.find(item => item.target === session.stage);
    if (entry === undefined || session.disposed) return;
    const key = [entry.contentRect.width, entry.contentRect.height].map(value => Math.round(value * 2) / 2).join("x");
    const previous = session.observedGeometryKey;
    session.observedGeometryKey = key;
    if (previous === undefined || previous === key) return;
    // As in the log-product surface, resize invalidates measurements, not the
    // semantic clock. Keep current owners until replacement paint is ready.
    session.stage.dataset["kpLogarithmChangeOfBaseGeometryState"] = "preparing";
    void prepareSurface(session, ++session.generation);
  });
  session.resizeObserver.observe(session.stage);
}

function applyFrame(
  session: KpLogarithmChangeOfBaseSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const accessibilityMode =
    session.player.dataset["kpEditorAnimationAccessibilityMode"] ??
    "full-motion";
  // Rewind's clock advances from zero too; paint follows semantic position.
  const position = sampleKpSynchronizedModelProjectionProgress(state.runtimeFrame.clock).presentationProgress;
  const progress = accessibilityMode === "reduced-motion" ||
      accessibilityMode === "static"
    ? position < 0.5 ? 0 : 1
    : position;
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  const ownership = session.transit.apply(progress);
  const accessibleIndex = ownership.visualOwner === "source-native" ? 0 : 1;
  setAccessibleEndpoint(session.endpointRoots[accessibleIndex], true);
  session.stage.dataset["kpLogarithmChangeOfBaseProgress"] = String(progress);
  session.stage.dataset["kpLogarithmChangeOfBaseVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-logarithm-change-of-base-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? session.endpoints[0]!.accessibleText
      : progress === 1
        ? session.endpoints[1]!.accessibleText
        : "Moving the argument and base into a natural-log quotient.";
  }
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpLogarithmChangeOfBaseSurfaceSession
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
