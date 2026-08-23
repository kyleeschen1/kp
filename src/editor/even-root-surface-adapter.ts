import {
  createKpEvenRootSolveAnimationAsset,
  kpEvenRootSolveAnimationId
} from "../animation/even-root-solve-adapter.ts";
import { compileKpFractionRootMigrationV2 } from
  "../domain-ir/fraction-root-migration-v2.ts";
import {
  createKpEvenRootSolveExemplar
} from "../semantic/even-root-solve-exemplar.ts";
import {
  bindKpEvenRootNativeEndpointOwnership,
  createKpEvenRootNativeEndpoints,
  settleAndObserveKpEvenRootNativeEndpoint,
  type KpEvenRootNativeEndpoint
} from "../rendering/even-root-native-endpoints.ts";
import {
  createKpEvenRootEvaluationTransitSession,
  createKpEvenRootInversePowerTransitSession,
  type KpEvenRootTransitSession
} from "../rendering/even-root-transit-session.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  kpNativeKatexFeaturePackLoader
} from "../rendering/native-katex-feature-pack-loader.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type { KpEditorAnimationPlayerState } from
  "./animation-player-state.ts";
import type { KpEditorAnimationSurfaceAdapter } from
  "./animation-surface-adapter-registry.ts";

const exemplar = createKpEvenRootSolveExemplar();
const endpoints = createKpEvenRootNativeEndpoints(exemplar);
const canonicalGovernance = compileKpFractionRootMigrationV2(
  createKpEvenRootSolveAnimationAsset()
);
const INVERSE_POWER_END = 0.58;

interface KpEvenRootSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly roots: readonly [
    HTMLElement,
    HTMLElement,
    HTMLElement,
    HTMLElement
  ];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  inversePower?: KpEvenRootTransitSession | undefined;
  evaluation?: KpEvenRootTransitSession | undefined;
  preparedFontRevision?: number | undefined;
  preparedViewportFingerprint?: string | undefined;
  invalidationQueued: boolean;
  resizeObserver?: ResizeObserver | undefined;
  removeWindowResizeListener?: (() => void) | undefined;
  unsubscribeFonts?: (() => void) | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, KpEvenRootSurfaceSession>();

export const kpEditorEvenRootSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.even-root.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 134,
  supports(state) {
    return state.animationId === kpEvenRootSolveAnimationId;
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (session === undefined) {
      session = mountSurface(player, slot, state);
      sessions.set(player, session);
      const mounted = session;
      player.addEventListener(
        KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeSurface(player, mounted),
        { once: true }
      );
      const generation = ++session.generation;
      void prepareSurface(session, generation);
    }
    session.pendingState = state;
    if (session.inversePower !== undefined && session.evaluation !== undefined) {
      applyFrame(session, state);
    }
  }
} satisfies KpEditorAnimationSurfaceAdapter);

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState
): KpEvenRootSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-root-rewrite-stage kp-even-root-stage";
  stage.dataset["kpEvenRootStage"] = "preparing";
  stage.dataset["kpEvenRootAnimationId"] = kpEvenRootSolveAnimationId;
  stage.dataset["kpEquationPresentationPlanId"] =
    canonicalGovernance.presentationPlan.id;
  stage.setAttribute("aria-label", "Solve x squared equals nine over the reals");
  const roots = [
    createEndpointRoot(document, endpoints.inversePower.source, true),
    createEndpointRoot(document, endpoints.inversePower.target, false),
    createEndpointRoot(document, endpoints.evaluation.source, false),
    createEndpointRoot(document, endpoints.evaluation.target, false)
  ] as const;
  const materialLayer = document.createElement("div");
  materialLayer.className =
    "kp-root-rewrite-stage__material-layer kp-even-root-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className =
    "kp-root-rewrite-stage__status kp-even-root-stage__status";
  status.dataset["kpEvenRootStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "The powered equation is ready.";
  stage.append(...roots, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    roots,
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    invalidationQueued: false,
    disposed: false
  };
}

async function prepareSurface(
  session: KpEvenRootSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const nativeKatex = await kpNativeKatexFeaturePackLoader.load();
    if (session.disposed || session.generation !== generation) return;
    const scenes = await Promise.all([
      settleAndObserveKpEvenRootNativeEndpoint({
        stage: session.stage,
        root: session.roots[0],
        endpoint: endpoints.inversePower.source,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      }),
      settleAndObserveKpEvenRootNativeEndpoint({
        stage: session.stage,
        root: session.roots[1],
        endpoint: endpoints.inversePower.target,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      }),
      settleAndObserveKpEvenRootNativeEndpoint({
        stage: session.stage,
        root: session.roots[2],
        endpoint: endpoints.evaluation.source,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      }),
      settleAndObserveKpEvenRootNativeEndpoint({
        stage: session.stage,
        root: session.roots[3],
        endpoint: endpoints.evaluation.target,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      })
    ]);
    if (session.disposed || session.generation !== generation) return;
    session.inversePower?.retire("measurement-invalidated");
    session.evaluation?.retire("measurement-invalidated");
    session.inversePower = createKpEvenRootInversePowerTransitSession({
      exemplar,
      endpoints: endpoints.inversePower,
      source: scenes[0],
      target: scenes[1]
    });
    session.evaluation = createKpEvenRootEvaluationTransitSession({
      exemplar,
      endpoints: endpoints.evaluation,
      source: scenes[2],
      target: scenes[3]
    });
    session.preparedFontRevision = session.fontReadiness.revision;
    session.preparedViewportFingerprint = viewportFingerprint(session.stage);
    installInvalidationLifecycle(session);
    session.stage.dataset["kpEvenRootExecutableTransitions"] = "2";
    session.stage.dataset["kpEvenRootDynamicTrackCounts"] = JSON.stringify([
      session.inversePower.canonical.executableMotion.dynamicTrackIds.length,
      session.evaluation.canonical.executableMotion.dynamicTrackIds.length
    ]);
    session.stage.dataset["kpEvenRootMeasurementRevision"] = String(generation);
    session.stage.dataset["kpEvenRootStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpEvenRootStage"] = "failed";
    session.stage.dataset["kpEvenRootError"] =
      error instanceof Error ? error.message : String(error);
    showOnly(session, nearestEndpointIndex(session.pendingState.progress));
  }
}

function applyFrame(
  session: KpEvenRootSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.inversePower === undefined || session.evaluation === undefined) {
    return;
  }
  const accessibilityMode = session.player.dataset[
    "kpEditorAnimationAccessibilityMode"
  ] ?? "full-motion";
  const reduced = accessibilityMode === "reduced-motion" ||
    accessibilityMode === "static";
  const progress = reduced
    ? reducedProgress(state.progress)
    : bounded(state.progress);
  session.roots.forEach((root) => {
    root.style.opacity = "0";
    setAccessible(root, false);
  });
  let ownerIndex: 0 | 1 | 2 | 3;
  if (progress <= INVERSE_POWER_END) {
    const local = progress / INVERSE_POWER_END;
    const ownership = session.inversePower.apply(local);
    ownerIndex = ownership.visualOwner === "source-native" ? 0 : 1;
    session.stage.dataset["kpEvenRootTransition"] = "inverse-power";
    session.stage.dataset["kpEvenRootTransitionProgress"] = String(local);
  } else {
    const local = (progress - INVERSE_POWER_END) /
      (1 - INVERSE_POWER_END);
    const ownership = session.evaluation.apply(local);
    ownerIndex = ownership.visualOwner === "source-native" ? 2 : 3;
    session.stage.dataset["kpEvenRootTransition"] = "root-value-evaluation";
    session.stage.dataset["kpEvenRootTransitionProgress"] = String(local);
  }
  setAccessible(session.roots[ownerIndex], true);
  session.stage.dataset["kpEvenRootProgress"] = String(progress);
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-even-root-status]"
  );
  if (status !== null) status.textContent = statusText(progress);
}

function installInvalidationLifecycle(session: KpEvenRootSurfaceSession): void {
  if (session.unsubscribeFonts !== undefined) return;
  session.unsubscribeFonts = session.fontReadiness.subscribe(() =>
    scheduleMeasurementReplacement(session)
  );
  const view = session.stage.ownerDocument.defaultView;
  if (view !== null) {
    const onResize = (): void => scheduleMeasurementReplacement(session);
    view.addEventListener("resize", onResize);
    session.removeWindowResizeListener = () =>
      view.removeEventListener("resize", onResize);
  }
  if (typeof ResizeObserver !== "undefined") {
    session.resizeObserver = new ResizeObserver(() =>
      scheduleMeasurementReplacement(session)
    );
    session.resizeObserver.observe(session.stage);
  }
}

function scheduleMeasurementReplacement(session: KpEvenRootSurfaceSession): void {
  if (session.disposed || session.invalidationQueued) return;
  session.invalidationQueued = true;
  queueMicrotask(() => {
    session.invalidationQueued = false;
    if (session.disposed) return;
    const changed =
      session.preparedFontRevision !== session.fontReadiness.revision ||
      session.preparedViewportFingerprint !== viewportFingerprint(session.stage);
    if (!changed) return;
    session.inversePower?.retire("measurement-invalidated");
    session.evaluation?.retire("measurement-invalidated");
    session.inversePower = undefined;
    session.evaluation = undefined;
    syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
    showOnly(session, nearestEndpointIndex(session.pendingState.progress));
    session.stage.dataset["kpEvenRootStage"] = "preparing";
    const generation = ++session.generation;
    void prepareSurface(session, generation);
  });
}

function createEndpointRoot(
  document: Document,
  endpoint: KpEvenRootNativeEndpoint,
  active: boolean
): HTMLElement {
  const root = document.createElement("div");
  root.className =
    "kp-root-rewrite-stage__endpoint kp-even-root-stage__endpoint";
  root.dataset["kpEvenRootEndpoint"] = endpoint.stateId;
  root.dataset["kpEvenRootEndpointSide"] = endpoint.endpoint;
  root.dataset["kpEvenRootLatex"] = endpoint.rawLatex;
  root.innerHTML = endpoint.nativeHtmlAndMathml;
  root.style.opacity = active ? "1" : "0";
  setAccessible(root, active);
  bindKpEvenRootNativeEndpointOwnership({ root, endpoint });
  return root;
}

function showOnly(session: KpEvenRootSurfaceSession, activeIndex: 0 | 1 | 2 | 3) {
  session.roots.forEach((root, index) => {
    const active = index === activeIndex;
    root.style.opacity = active ? "1" : "0";
    setAccessible(root, active);
  });
}

function setAccessible(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function nearestEndpointIndex(progress: number): 0 | 1 | 2 | 3 {
  if (progress < INVERSE_POWER_END / 2) return 0;
  if (progress <= INVERSE_POWER_END) return 1;
  if (progress < (1 + INVERSE_POWER_END) / 2) return 2;
  return 3;
}

function reducedProgress(progress: number): number {
  if (progress < INVERSE_POWER_END / 2) return 0;
  if (progress < (1 + INVERSE_POWER_END) / 2) return INVERSE_POWER_END;
  return 1;
}

function statusText(progress: number): string {
  if (progress === 0) return "The powered equation is ready.";
  if (progress < INVERSE_POWER_END) {
    return "The exponent becomes an implicit root index and both branches appear.";
  }
  if (progress === INVERSE_POWER_END) {
    return "Both real square-root branches are explicit.";
  }
  if (progress < 1) return "The square root evaluates separately.";
  return "The two real solutions are x equals plus or minus three.";
}

function viewportFingerprint(stage: HTMLElement): string {
  const rect = stage.getBoundingClientRect();
  const dpr = stage.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  return `${rect.width}x${rect.height}@${dpr}`;
}

function bounded(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function disposeSurface(
  player: HTMLElement,
  session: KpEvenRootSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.resizeObserver?.disconnect();
  session.removeWindowResizeListener?.();
  session.unsubscribeFonts?.();
  session.inversePower?.retire("surface-disposed");
  session.evaluation?.retire("surface-disposed");
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
