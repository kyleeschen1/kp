import {
  createKpCompoundRootCarrierAnimationAsset,
  kpCompoundRootCarrierAnimationId
} from "../animation/compound-root-carrier-adapter.ts";
import { compileKpFractionRootMigrationV2 } from
  "../domain-ir/fraction-root-migration-v2.ts";
import {
  kpCompoundRootCarrierNativeEndpoints
} from "../rendering/compound-root-carrier-native-endpoints.ts";
import type {
  KpCompoundRootCarrierTransitSession
} from "../rendering/compound-root-carrier-transit-session.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  bindKpRootRewriteNativeEndpointOwnership,
  settleAndObserveKpRootRewriteNativeEndpoint,
  type KpRootRewriteNativeEndpoint
} from "../rendering/root-rewrite-native-endpoint.ts";
import {
  kpNativeKatexFeaturePackLoader
} from "../rendering/native-katex-feature-pack-loader.ts";
import {
  kpCompoundRootCarrierExemplar
} from "../semantic/compound-root-carrier-exemplar.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type { KpEditorAnimationPlayerState } from
  "./animation-player-state.ts";
import type { KpEditorAnimationSurfaceAdapter } from
  "./animation-surface-adapter-registry.ts";

interface KpCompoundRootCarrierSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly roots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpCompoundRootCarrierTransitSession | undefined;
  preparedFontRevision?: number | undefined;
  preparedViewportFingerprint?: string | undefined;
  invalidationQueued: boolean;
  resizeObserver?: ResizeObserver | undefined;
  removeWindowResizeListener?: (() => void) | undefined;
  unsubscribeFonts?: (() => void) | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement,
  KpCompoundRootCarrierSurfaceSession>();
const canonicalGovernance = compileKpFractionRootMigrationV2(
  createKpCompoundRootCarrierAnimationAsset()
);

export const kpEditorCompoundRootCarrierSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.root.compound-carrier.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 135,
  supports(state) {
    return state.animationId === kpCompoundRootCarrierAnimationId;
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
    if (session.transit !== undefined) applyFrame(session, state);
  }
} satisfies KpEditorAnimationSurfaceAdapter);

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState
): KpCompoundRootCarrierSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-root-rewrite-stage kp-even-root-stage";
  stage.dataset["kpCompoundRootCarrierStage"] = "preparing";
  stage.dataset["kpCompoundRootCarrierAnimationId"] =
    kpCompoundRootCarrierAnimationId;
  stage.dataset["kpEquationPresentationPlanId"] =
    canonicalGovernance.presentationPlan.id;
  stage.setAttribute(
    "aria-label",
    "The square root of the square of x plus one becomes its absolute value"
  );
  const roots = [
    endpointRoot(document, kpCompoundRootCarrierNativeEndpoints.source, true),
    endpointRoot(document, kpCompoundRootCarrierNativeEndpoints.target, false)
  ] as const;
  const materialLayer = document.createElement("div");
  materialLayer.className =
    "kp-root-rewrite-stage__material-layer kp-even-root-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className =
    "kp-root-rewrite-stage__status kp-even-root-stage__status";
  status.dataset["kpCompoundRootCarrierStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "The compound perfect square is ready.";
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
  session: KpCompoundRootCarrierSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const [nativeKatex, realization] = await Promise.all([
      kpNativeKatexFeaturePackLoader.load(),
      import("../rendering/compound-root-carrier-transit-session.ts")
    ]);
    if (session.disposed || session.generation !== generation) return;
    const [source, target] = await Promise.all([
      settleAndObserveKpRootRewriteNativeEndpoint({
        stage: session.stage,
        root: session.roots[0],
        endpoint: kpCompoundRootCarrierNativeEndpoints.source,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      }),
      settleAndObserveKpRootRewriteNativeEndpoint({
        stage: session.stage,
        root: session.roots[1],
        endpoint: kpCompoundRootCarrierNativeEndpoints.target,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      })
    ]);
    if (session.disposed || session.generation !== generation) return;
    session.transit?.retire("measurement-invalidated");
    session.transit = realization.createKpCompoundRootCarrierTransitSession({
      exemplar: kpCompoundRootCarrierExemplar,
      endpoints: kpCompoundRootCarrierNativeEndpoints,
      source,
      target
    });
    session.preparedFontRevision = session.fontReadiness.revision;
    session.preparedViewportFingerprint = viewportFingerprint(session.stage);
    installInvalidationLifecycle(session);
    session.stage.dataset["kpCompoundRootCarrierDynamicTrackCount"] = String(
      session.transit.canonical.executableMotion.dynamicTrackIds.length
    );
    session.stage.dataset["kpCompoundRootCarrierSubtreeMotion"] =
      session.transit.motion.subtreeMotion.motionMode;
    session.stage.dataset["kpCompoundRootCarrierMeasurementRevision"] =
      String(generation);
    session.stage.dataset["kpCompoundRootCarrierStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpCompoundRootCarrierStage"] = "failed";
    session.stage.dataset["kpCompoundRootCarrierError"] =
      error instanceof Error ? error.message : String(error);
    showOnly(session, session.pendingState.progress < 0.5 ? 0 : 1);
  }
}

function applyFrame(
  session: KpCompoundRootCarrierSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  const accessibilityMode = session.player.dataset[
    "kpEditorAnimationAccessibilityMode"
  ] ?? "full-motion";
  const progress = accessibilityMode === "full-motion"
    ? bounded(state.progress)
    : state.progress < 0.5 ? 0 : 1;
  session.roots.forEach((root) => {
    root.style.opacity = "0";
    setAccessible(root, false);
  });
  const ownership = session.transit.apply(progress);
  const ownerIndex = ownership.visualOwner === "source-native" ? 0 : 1;
  setAccessible(session.roots[ownerIndex], true);
  session.stage.dataset["kpCompoundRootCarrierProgress"] = String(progress);
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-compound-root-carrier-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? "The compound perfect square is ready."
      : progress < 1
        ? "The carrier stays intact while its root syntax changes."
        : "The same carrier is now enclosed by absolute-value bars.";
  }
}

function endpointRoot(
  document: Document,
  endpoint: KpRootRewriteNativeEndpoint,
  active: boolean
): HTMLElement {
  const root = document.createElement("div");
  root.className =
    "kp-root-rewrite-stage__endpoint kp-even-root-stage__endpoint";
  root.dataset["kpCompoundRootCarrierEndpoint"] = endpoint.stateId;
  root.dataset["kpCompoundRootCarrierEndpointSide"] = endpoint.endpoint;
  root.dataset["kpCompoundRootCarrierLatex"] = endpoint.annotated.rawLatex;
  root.innerHTML = endpoint.nativeHtmlAndMathml;
  root.style.opacity = active ? "1" : "0";
  setAccessible(root, active);
  bindKpRootRewriteNativeEndpointOwnership({ root, endpoint });
  return root;
}

function installInvalidationLifecycle(
  session: KpCompoundRootCarrierSurfaceSession
): void {
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

function scheduleMeasurementReplacement(
  session: KpCompoundRootCarrierSurfaceSession
): void {
  if (session.disposed || session.invalidationQueued) return;
  session.invalidationQueued = true;
  queueMicrotask(() => {
    session.invalidationQueued = false;
    if (session.disposed) return;
    const changed =
      session.preparedFontRevision !== session.fontReadiness.revision ||
      session.preparedViewportFingerprint !== viewportFingerprint(session.stage);
    if (!changed) return;
    session.transit?.retire("measurement-invalidated");
    session.transit = undefined;
    syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
    showOnly(session, session.pendingState.progress < 0.5 ? 0 : 1);
    session.stage.dataset["kpCompoundRootCarrierStage"] = "preparing";
    const generation = ++session.generation;
    void prepareSurface(session, generation);
  });
}

function showOnly(
  session: KpCompoundRootCarrierSurfaceSession,
  activeIndex: 0 | 1
): void {
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
  session: KpCompoundRootCarrierSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.resizeObserver?.disconnect();
  session.removeWindowResizeListener?.();
  session.unsubscribeFonts?.();
  session.transit?.retire("surface-disposed");
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
