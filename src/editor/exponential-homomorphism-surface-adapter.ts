/// <reference types="vite/client" />

import {
  kpExponentialHomomorphismAnimationId
} from "../animation/exponential-homomorphism-adapter.ts";
import {
  kpExponentialQuotientPressureAnimationId
} from "../animation/exponential-quotient-pressure-adapter.ts";
import {
  kpCanonicalExponentialHomomorphismAuthority
} from "../semantic/exponential-homomorphism-exemplar.ts";
import {
  kpExponentialQuotientPressureAuthority
} from "../semantic/exponential-quotient-pressure.ts";
import type {
  KpExponentialHomomorphismCorrespondenceAuthority
} from "../semantic/exponential-homomorphism-correspondence.ts";
import type { KpHomomorphicTargetTopology } from
  "../animation/homomorphic-application-handoff-taxonomy.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  bindKpExponentialNativeEndpointOwnership,
  createKpExponentialHomomorphismNativeEndpoints,
  settleAndObserveKpExponentialNativeEndpoint,
  type KpExponentialNativeEndpoint
} from "../rendering/exponential-homomorphism-native-endpoints.ts";
import {
  createKpExponentialHomomorphismTransitSession,
  type KpExponentialHomomorphismTransitSession
} from "../rendering/exponential-homomorphism-transit-session.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  kpNativeKatexFeaturePackLoader
} from "../rendering/native-katex-feature-pack-loader.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface KpExponentialHomomorphismSurfaceSession {
  readonly definition: KpExponentialHomomorphismSurfaceDefinition;
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly [HTMLElement, HTMLElement];
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  transit?: KpExponentialHomomorphismTransitSession | undefined;
  preparedFontRevision?: number | undefined;
  preparedViewportFingerprint?: string | undefined;
  invalidationQueued: boolean;
  replacementPreparing: boolean;
  resizeObserver?: ResizeObserver | undefined;
  removeWindowResizeListener?: (() => void) | undefined;
  unsubscribeFonts?: (() => void) | undefined;
  disposed: boolean;
}

interface KpExponentialHomomorphismSurfaceDefinition {
  readonly animationId:
    | typeof kpExponentialHomomorphismAnimationId
    | typeof kpExponentialQuotientPressureAnimationId;
  readonly authority: KpExponentialHomomorphismCorrespondenceAuthority;
  readonly endpoints: ReturnType<
    typeof createKpExponentialHomomorphismNativeEndpoints
  >;
  readonly targetTopology: KpHomomorphicTargetTopology;
  readonly ariaLabel: string;
  readonly sourceStatus: string;
  readonly transitStatus: string;
  readonly targetStatus: string;
}

const sessions = new WeakMap<HTMLElement,
  KpExponentialHomomorphismSurfaceSession>();

const definitions = Object.freeze([
  definition({
    animationId: kpExponentialHomomorphismAnimationId,
    authority: kpCanonicalExponentialHomomorphismAuthority,
    targetTopology: "lateral-product",
    ariaLabel: "Turn an exponential sum into a product",
    sourceStatus: "Power with an additive exponent ready.",
    transitStatus:
      "The exponent payloads persist while the base derives two powers.",
    targetStatus: "The additive exponent is now a product of powers."
  }),
  definition({
    animationId: kpExponentialQuotientPressureAnimationId,
    authority: kpExponentialQuotientPressureAuthority,
    targetTopology: "vertical-quotient",
    ariaLabel: "Turn an exponential difference into a quotient",
    sourceStatus: "Power with a subtractive exponent ready.",
    transitStatus:
      "The payloads persist while numerator and denominator powers form.",
    targetStatus: "The subtractive exponent is now a quotient of powers."
  })
]);

export const kpEditorExponentialHomomorphismSurfaceAdapter = Object.freeze({
  id:
    "editor-animation-surface.exponential-homomorphism.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 133,
  supports(state) {
    return findDefinition(state.animationId) !== undefined;
  },
  render({ player, slot, state }) {
    const definitionValue = findDefinition(state.animationId);
    if (definitionValue === undefined) return;
    let session = sessions.get(player);
    if (
      session !== undefined &&
      session.definition.animationId !== definitionValue.animationId
    ) {
      disposeSurface(player, session);
      session = undefined;
    }
    if (session === undefined) {
      session = mountSurface(player, slot, state, definitionValue);
      sessions.set(player, session);
      const mountedSession = session;
      player.addEventListener(
        KP_EDITOR_ANIMATION_DISPOSE_EVENT,
        () => disposeSurface(player, mountedSession),
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
  state: KpEditorAnimationPlayerState,
  definitionValue: KpExponentialHomomorphismSurfaceDefinition
): KpExponentialHomomorphismSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-exponential-homomorphism-stage";
  stage.dataset["kpExponentialHomomorphismStage"] = "preparing";
  stage.dataset["kpExponentialHomomorphismAnimationId"] =
    definitionValue.animationId;
  stage.setAttribute("aria-label", definitionValue.ariaLabel);

  const roots: [HTMLElement, HTMLElement] = [
    createEndpointRoot(document,
      definitionValue.endpoints.source, true),
    createEndpointRoot(document,
      definitionValue.endpoints.target, false)
  ];
  const materialLayer = document.createElement("div");
  materialLayer.className =
    "kp-exponential-homomorphism-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-exponential-homomorphism-stage__status";
  status.dataset["kpExponentialHomomorphismStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = definitionValue.sourceStatus;
  stage.append(...roots, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    definition: definitionValue,
    player,
    stage,
    endpointRoots: Object.freeze(roots) as readonly [HTMLElement, HTMLElement],
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    invalidationQueued: false,
    replacementPreparing: false,
    disposed: false
  };
}

async function prepareSurface(
  session: KpExponentialHomomorphismSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const nativeKatex = await kpNativeKatexFeaturePackLoader.load();
    if (session.disposed || session.generation !== generation) return;
    const source = await settleAndObserveKpExponentialNativeEndpoint({
      stage: session.stage,
      root: session.endpointRoots[0],
      endpoint: session.definition.endpoints.source,
      fontReadiness: session.fontReadiness,
      observe: nativeKatex.observe.settleAndObserve
    });
    const target = await settleAndObserveKpExponentialNativeEndpoint({
      stage: session.stage,
      root: session.endpointRoots[1],
      endpoint: session.definition.endpoints.target,
      fontReadiness: session.fontReadiness,
      observe: nativeKatex.observe.settleAndObserve
    });
    if (session.disposed || session.generation !== generation) return;
    session.transit = createKpExponentialHomomorphismTransitSession({
      authority: session.definition.authority,
      sourceEndpoint: session.definition.endpoints.source,
      targetEndpoint: session.definition.endpoints.target,
      source,
      target,
      targetTopology: session.definition.targetTopology
    });
    session.preparedFontRevision = session.fontReadiness.revision;
    session.preparedViewportFingerprint = viewportFingerprint(session.stage);
    session.replacementPreparing = false;
    installInvalidationLifecycle(session);
    session.stage.dataset["kpExponentialHomomorphismTrackSummary"] =
      JSON.stringify(session.transit.canonical.session.tracks.map((track) => ({
        id: track.id,
        lifecycle: track.lifecycle,
        timingGroupId: track.timingGroupId,
        motionAxisConstraint: track.motionAxisConstraint
      })));
    session.stage.dataset["kpExponentialHomomorphismMeasurementRevision"] =
      String(generation);
    session.stage.dataset["kpExponentialHomomorphismStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpExponentialHomomorphismStage"] = "failed";
    session.stage.dataset["kpExponentialHomomorphismError"] =
      error instanceof Error ? error.message : String(error);
    session.replacementPreparing = false;
    showEndpoint(session, 0);
  }
}

function installInvalidationLifecycle(
  session: KpExponentialHomomorphismSurfaceSession
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
  session: KpExponentialHomomorphismSurfaceSession
): void {
  if (
    session.disposed ||
    session.invalidationQueued ||
    session.replacementPreparing
  ) return;
  session.invalidationQueued = true;
  queueMicrotask(() => {
    session.invalidationQueued = false;
    if (session.disposed) return;
    const changed =
      session.preparedFontRevision !== session.fontReadiness.revision ||
      session.preparedViewportFingerprint !== viewportFingerprint(session.stage);
    if (!changed) return;
    // Measured paint belongs to one font/viewport transaction. Retire it
    // before rebuilding so stale geometry can never flash after a resize.
    session.replacementPreparing = true;
    session.transit?.retire("measurement-invalidated");
    session.transit = undefined;
    syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
    showEndpoint(session, session.pendingState.progress < 0.5 ? 0 : 1);
    session.stage.dataset["kpExponentialHomomorphismStage"] = "preparing";
    const generation = ++session.generation;
    void prepareSurface(session, generation);
  });
}

function viewportFingerprint(stage: HTMLElement): string {
  const rect = stage.getBoundingClientRect();
  const dpr = stage.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  return `${rect.width}x${rect.height}@${dpr}`;
}

function applyFrame(
  session: KpExponentialHomomorphismSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (session.transit === undefined) return;
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  const accessibilityMode = session.player.dataset[
    "kpEditorAnimationAccessibilityMode"
  ] ?? "full-motion";
  const reduced = accessibilityMode === "reduced-motion" ||
    accessibilityMode === "static";
  const progress = reduced ? (state.progress < 0.5 ? 0 : 1) : state.progress;
  const ownership = session.transit.apply(progress);
  setAccessibleEndpoint(
    session.endpointRoots[ownership.visualOwner === "source-native" ? 0 : 1],
    true
  );
  session.stage.dataset["kpExponentialHomomorphismProgress"] = String(progress);
  session.stage.dataset["kpExponentialHomomorphismVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-exponential-homomorphism-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? session.definition.sourceStatus
      : progress === 1
        ? session.definition.targetStatus
        : session.definition.transitStatus;
  }
}

function definition(input: Omit<KpExponentialHomomorphismSurfaceDefinition,
"endpoints">): KpExponentialHomomorphismSurfaceDefinition {
  return Object.freeze({
    ...input,
    endpoints: createKpExponentialHomomorphismNativeEndpoints(input.authority)
  });
}

function findDefinition(
  animationId: string
): KpExponentialHomomorphismSurfaceDefinition | undefined {
  return definitions.find((candidate) =>
    candidate.animationId === animationId
  );
}

function createEndpointRoot(
  document: Document,
  endpoint: KpExponentialNativeEndpoint,
  active: boolean
): HTMLElement {
  const root = document.createElement("div");
  root.className = "kp-exponential-homomorphism-stage__endpoint";
  root.dataset["kpExponentialHomomorphismEndpoint"] = endpoint.endpoint;
  root.dataset["kpExponentialHomomorphismLatex"] = endpoint.rawLatex;
  root.innerHTML = endpoint.nativeHtmlAndMathml;
  root.style.opacity = active ? "1" : "0";
  setAccessibleEndpoint(root, active);
  bindKpExponentialNativeEndpointOwnership({ root, endpoint });
  return root;
}

function showEndpoint(
  session: KpExponentialHomomorphismSurfaceSession,
  activeIndex: 0 | 1
): void {
  session.endpointRoots.forEach((root, index) => {
    root.style.opacity = index === activeIndex ? "1" : "0";
    setAccessibleEndpoint(root, index === activeIndex);
  });
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpExponentialHomomorphismSurfaceSession
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
