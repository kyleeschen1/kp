/// <reference types="vite/client" />

import {
  kpFiniteSumExpansionExemplarId
} from "../animation/finite-sum-expansion-exemplar.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
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
  kpFiniteSumEquivalenceFrame,
  kpFiniteSumEquivalenceFrameOccurrenceIds
} from "../semantic/finite-sum-equivalence-frame.ts";
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
  readonly frozenSource: HTMLElement;
  readonly relation: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly materialLayer: HTMLElement;
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
  stage.className =
    "kp-finite-sum-stage kp-finite-sum-equivalence-stage";
  stage.dataset["kpFiniteSumStage"] = "preparing";
  stage.dataset["kpStateRetentionProjectionId"] =
    kpFiniteSumEquivalenceFrame.projection.id;
  stage.dataset["kpStateRetentionPolicy"] =
    kpFiniteSumEquivalenceFrame.projection.policy;
  stage.setAttribute("aria-label",
    "Construct a finite sum expansion as a retained equivalence");
  const frame = document.createElement("div");
  frame.className = "kp-finite-sum-stage__frame";
  const sourceCell = document.createElement("div");
  sourceCell.className = "kp-finite-sum-stage__cell";
  const targetCell = document.createElement("div");
  targetCell.className = "kp-finite-sum-stage__cell";
  const frozenSource = document.createElement("div");
  frozenSource.className = "kp-finite-sum-stage__frozen-source";
  frozenSource.dataset["kpStateRetentionOccurrenceId"] =
    kpFiniteSumEquivalenceFrameOccurrenceIds.source;
  frozenSource.innerHTML =
    kpCanonicalFiniteSumNativeEndpoints[0].nativeHtmlAndMathml;
  const relation = document.createElement("div");
  relation.className = "kp-finite-sum-stage__relation";
  relation.dataset["kpStateRetentionOccurrenceId"] =
    kpFiniteSumEquivalenceFrameOccurrenceIds.relation;
  relation.innerHTML = renderLatexToHtml("=", {
    displayMode: true,
    output: "htmlAndMathml"
  });
  const createRoot = (index: 0 | 1): HTMLElement => {
    const endpoint = kpCanonicalFiniteSumNativeEndpoints[index];
    const root = document.createElement("div");
    root.className =
      `kp-finite-sum-stage__endpoint ` +
      `kp-finite-sum-stage__measurement ` +
      `kp-finite-sum-stage__measurement--${endpoint.endpoint}`;
    root.dataset["kpFiniteSumEndpoint"] = endpoint.endpoint;
    root.dataset["kpStateRetentionOccurrenceId"] = index === 0
      ? kpFiniteSumEquivalenceFrame.projection.transitOccurrence.id
      : kpFiniteSumEquivalenceFrameOccurrenceIds.target;
    root.innerHTML = endpoint.nativeHtmlAndMathml;
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
    bindKpFiniteSumNativeEndpointOwnership({ root, endpoint });
    return root;
  };
  const roots: [HTMLElement, HTMLElement] = [createRoot(0), createRoot(1)];
  sourceCell.append(frozenSource, roots[0]);
  targetCell.append(roots[1]);
  frame.append(sourceCell, relation, targetCell);
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-finite-sum-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-finite-sum-stage__status";
  status.dataset["kpFiniteSumStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Finite sum ready.";
  stage.append(frame, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    frozenSource,
    relation,
    endpointRoots: Object.freeze(roots),
    materialLayer,
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
    session.endpointRoots.forEach((root) => {
      root.style.opacity = "0";
      setAccessibleEndpoint(root, false);
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
  session.materialLayer.style.visibility = progress === 0 || progress === 1
    ? "hidden"
    : "visible";
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  if (ownership.visualOwner === "target-native") {
    session.endpointRoots[1].style.opacity = "1";
    setAccessibleEndpoint(session.endpointRoots[1], true);
  }
  session.stage.dataset["kpFiniteSumProgress"] = String(progress);
  session.stage.dataset["kpFiniteSumVisualOwner"] = ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-finite-sum-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? "Finite sum ready."
      : progress === 1
        ? "The retained finite sum equals its three-term expansion."
        : "The retained sum is generating one ordered term at a time.";
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
