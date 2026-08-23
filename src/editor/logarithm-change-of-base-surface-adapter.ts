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
import {
  bindKpLogarithmChangeOfBaseNativeEndpointOwnership,
  kpCanonicalLogarithmChangeOfBaseNativeEndpoints,
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

interface KpLogarithmChangeOfBaseSurfaceSession {
  readonly governance: KpEquationAssetMigrationV2;
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpLogarithmChangeOfBaseTransitSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement,
  KpLogarithmChangeOfBaseSurfaceSession>();
const canonicalGovernance = compileKpLogarithmChangeOfBaseMigrationV2(
  createKpLogarithmChangeOfBaseExemplarAsset()
);

export const kpEditorLogarithmChangeOfBaseSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.logarithm-change-of-base.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 132,
  supports(state) {
    return state.animationId === kpLogarithmChangeOfBaseExemplarId;
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
): KpLogarithmChangeOfBaseSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-logarithm-change-of-base-stage";
  stage.dataset["kpLogarithmChangeOfBaseStage"] = "preparing";
  stage.dataset["kpEquationPresentationPlanId"] =
    canonicalGovernance.presentationPlan.id;
  stage.setAttribute("aria-label", "Change logarithm base");
  const createRoot = (
    endpoint: typeof kpCanonicalLogarithmChangeOfBaseNativeEndpoints[number],
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
    createRoot(kpCanonicalLogarithmChangeOfBaseNativeEndpoints[0]!, true),
    createRoot(kpCanonicalLogarithmChangeOfBaseNativeEndpoints[1]!, false)
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
  status.textContent = "Log base two of seven ready.";
  stage.append(...roots, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    governance: canonicalGovernance,
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
  session: KpLogarithmChangeOfBaseSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const source = await settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint({
      endpointSide: "source",
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: kpCanonicalLogarithmChangeOfBaseNativeEndpoints[0]!,
      fontReadiness: session.fontReadiness
    });
    const target = await settleAndObserveKpLogarithmChangeOfBaseNativeEndpoint({
      endpointSide: "target",
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: kpCanonicalLogarithmChangeOfBaseNativeEndpoints[1]!,
      fontReadiness: session.fontReadiness
    });
    if (session.disposed || session.generation !== generation) return;
    session.transit = createKpLogarithmChangeOfBaseTransitSession({
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
    session.stage.dataset["kpLogarithmChangeOfBaseTrackSummary"] =
      JSON.stringify(session.transit.canonical.session.tracks.map((track) => ({
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
    session.stage.dataset["kpLogarithmChangeOfBaseStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpLogarithmChangeOfBaseStage"] = "failed";
    session.stage.dataset["kpLogarithmChangeOfBaseError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function applyFrame(
  session: KpLogarithmChangeOfBaseSurfaceSession,
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
  session.stage.dataset["kpLogarithmChangeOfBaseProgress"] = String(progress);
  session.stage.dataset["kpLogarithmChangeOfBaseVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-logarithm-change-of-base-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? "Log base two of seven ready."
      : progress === 1
        ? "Natural log of seven divided by natural log of two."
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
  session.transit?.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
