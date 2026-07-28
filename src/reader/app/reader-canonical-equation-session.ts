import {
  observeKpNativeKatexRenderedScene
} from "../../rendering/native-katex-rendered-scene.ts";
import type {
  KpEquationFontReadiness
} from "../../rendering/equation-font-readiness.ts";
import {
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationPureScenePlanCompiler,
  type KpReaderEquationRenderPlan,
  type KpReaderEquationSceneCompositorFactory
} from "../renderers/public-api.ts";
import type {
  KpAppliedEquationStageLayout,
  KpEquationStageMeasurementIdentity
} from "../runtime/public-api.ts";
import type {
  KpCorridorCertifiedEquationStageLayout
} from "../runtime/public-api.ts";
import {
  assertKpAppliedEquationStageLayout,
  createKpReaderCompositorGeometryCacheIdentity,
  createKpReaderCompositorPurePlanCache,
  createKpReaderIdlePrewarmQueue,
  createKpReaderLatestSessionHandoff,
  recordKpReaderAdjacentPrewarmCompilation,
  recordKpReaderCanonicalSessionApply,
  recordKpReaderCanonicalSessionBuild,
  recordKpReaderCanonicalSessionReuse,
  recordKpReaderPurePlanCacheHit,
  recordKpReaderPurePlanCompilation,
  recordKpReaderProtectedTransitCertificateReuse,
  recordKpReaderProtectedTransitCompilation,
  type KpReaderIdlePrewarmQueue
} from "../runtime/public-api.ts";

export interface KpReaderCanonicalEquationFrame {
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly fitSurface: HTMLElement;
  readonly progress: number;
  readonly motionMode: "continuous" | "essential" | "checkpoint";
  readonly fontReadiness: KpEquationFontReadiness;
  readonly presentationRevision: string;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly appliedStageLayout?:
    KpAppliedEquationStageLayout<
      KpCorridorCertifiedEquationStageLayout
    > | undefined;
}

export interface KpReaderCanonicalEquationSession {
  readonly transitionIds: readonly string[];
  readonly apply: (input: KpReaderCanonicalEquationFrame) => boolean;
  readonly prewarm: (
    frames: readonly KpReaderCanonicalEquationFrame[]
  ) => void;
  readonly invalidate: () => void;
  readonly dispose: () => void;
}

export function createKpReaderCanonicalEquationSession(input: {
  readonly transitionIds: readonly string[];
  readonly createSession: KpReaderEquationSceneCompositorFactory;
  readonly compilePurePlan: KpReaderEquationPureScenePlanCompiler;
  readonly requireAppliedStageLayout?: boolean | undefined;
  readonly enablePurePlanCache?: boolean | undefined;
  readonly enableAdjacentPrewarm?: boolean | undefined;
}): KpReaderCanonicalEquationSession {
  if (
    input.transitionIds.length === 0 ||
    new Set(input.transitionIds).size !== input.transitionIds.length
  ) {
    throw new Error(
      "Reader canonical equation session requires unique transition ids."
    );
  }
  const transitionIds = Object.freeze([...input.transitionIds]);
  let session:
    ReturnType<KpReaderEquationSceneCompositorFactory> | undefined;
  let sessionKey: string | undefined;
  let structuralSessionKey: string | undefined;
  let structuralFitSurface: HTMLElement | undefined;
  let materialLayer: HTMLElement | undefined;
  const purePlanCache = createKpReaderCompositorPurePlanCache<
    ReturnType<KpReaderEquationPureScenePlanCompiler>
  >();
  const sessionHandoff = createKpReaderLatestSessionHandoff();
  let prewarmQueue: KpReaderIdlePrewarmQueue | undefined;
  const releaseCurrentSession = (
    preserveStructuralSuccession = false
  ): void => {
    session?.dispose({ preserveStructuralSuccession });
    session = undefined;
    sessionKey = undefined;
    structuralSessionKey = undefined;
    structuralFitSurface = undefined;
    materialLayer?.remove();
    materialLayer = undefined;
  };
  const geometryIdentityFor = (
    frame: KpReaderCanonicalEquationFrame,
    transitionId: string
  ) => createKpReaderCompositorGeometryCacheIdentity({
    transitionId,
    renderPlanId: frame.renderPlan.id,
    materialPlanId: frame.materialPlan.id,
    fontRevision: frame.fontReadiness.revision,
    measurementIdentity: frame.measurementIdentity,
    layoutApplicationId:
      frame.appliedStageLayout?.applicationId ?? "native",
    surfaceWidthPx: frame.fitSurface.offsetWidth,
    surfaceHeightPx: frame.fitSurface.offsetHeight,
    devicePixelRatio:
      frame.fitSurface.ownerDocument.defaultView?.devicePixelRatio ?? 1,
    motionMode: frame.motionMode,
    presentationGeometryRevision: frame.presentationRevision
  });
  const purePlanInputFor = (
    frame: KpReaderCanonicalEquationFrame,
    transitionId: string,
    includeHiddenPaint: boolean
  ) => {
    bindReaderPaintOwnership(
      frame.renderPlan,
      frame.materialPlan,
      frame.fitSurface
    );
    const sourceRoot = requireDescendant<HTMLElement>(
      frame.fitSurface,
      '[data-kp-reader-native="source"]'
    );
    const targetRoot = requireDescendant<HTMLElement>(
      frame.fitSurface,
      '[data-kp-reader-native="target"]'
    );
    const observe = (endpoint: "source" | "target", root: HTMLElement) =>
      observeKpNativeKatexRenderedScene({
        endpoint,
        stage: frame.fitSurface,
        root,
        semanticEntityId: `${transitionId}.${endpoint}`,
        presentationGroupId: `${transitionId}.${endpoint}`,
        fontReadiness: frame.fontReadiness,
        includeHiddenPaint
      });
    return {
      renderPlan: frame.renderPlan,
      materialPlan: frame.materialPlan,
      transitionId,
      motionMode: frame.motionMode,
      measurementIdentity: frame.measurementIdentity,
      ...(frame.appliedStageLayout === undefined
        ? {}
        : { stageLayout: frame.appliedStageLayout.certificate }),
      source: observe("source", sourceRoot),
      target: observe("target", targetRoot)
    };
  };
  const recordPureCompilation = (
    ownerWindow: Window | null
  ): void => {
    if (ownerWindow === null) return;
    recordKpReaderPurePlanCompilation(ownerWindow);
    recordKpReaderProtectedTransitCompilation(ownerWindow);
  };

  return {
    transitionIds,
    apply: (frame) => {
      const transitionId = frame.renderPlan.transitions[0]?.id;
      if (
        transitionId === undefined ||
        !transitionIds.includes(transitionId)
      ) {
        // The structural renderer releases its scarce WebGL lease at native
        // endpoints. Retain the prepared reader session so returning across an
        // attention boundary does not flash through asynchronous recapture.
        return false;
      }
      const nextKey = [
        transitionId,
        frame.renderPlan.id,
        frame.materialPlan.id,
        frame.presentationRevision,
        frame.motionMode,
        frame.fontReadiness.revision,
        frame.measurementIdentity.coordinateSpaceId,
        frame.measurementIdentity.revision,
        frame.appliedStageLayout?.applicationId ?? "native",
        frame.fitSurface.offsetWidth,
        frame.fitSurface.offsetHeight
      ].join(":");
      const nextStructuralSessionKey = [
        transitionId,
        frame.renderPlan.id,
        frame.materialPlan.id,
        frame.motionMode,
        frame.fontReadiness.revision,
        frame.fitSurface.offsetWidth,
        frame.fitSurface.offsetHeight
      ].join(":");
      if (
        input.requireAppliedStageLayout === true &&
        frame.appliedStageLayout === undefined
      ) {
        throw new Error(
          "Reader canonical equation session requires applied stage layout."
        );
      }
      if (frame.appliedStageLayout !== undefined) {
        assertKpAppliedEquationStageLayout(
          frame.appliedStageLayout,
          frame.measurementIdentity,
          "Reader canonical equation session"
        );
      }
      if (session === undefined || sessionKey !== nextKey) {
        const handoffToken = sessionHandoff.issue();
        const ownerWindow = frame.fitSurface.ownerDocument.defaultView;
        const buildStartedAt = ownerWindow?.performance.now() ?? Date.now();
        // Focus-only presentation revisions rebuild their typography plan but
        // retain the expensive structural capture. The inner renderer still
        // releases its WebGL lease independently at native endpoints.
        releaseCurrentSession(
          session !== undefined &&
            structuralFitSurface === frame.fitSurface &&
            structuralSessionKey === nextStructuralSessionKey
        );
        materialLayer = createMaterialLayer(frame.fitSurface);
        const geometryIdentity = geometryIdentityFor(frame, transitionId);
        const sceneInput = purePlanInputFor(frame, transitionId, false);
        let purePlan = input.enablePurePlanCache === true
          ? purePlanCache.get(geometryIdentity)
          : undefined;
        if (purePlan === undefined) {
          purePlan = input.compilePurePlan(sceneInput);
          if (input.enablePurePlanCache === true) {
            purePlanCache.set(geometryIdentity, purePlan);
          }
          recordPureCompilation(ownerWindow);
        } else if (
          input.enablePurePlanCache === true &&
          ownerWindow !== null
        ) {
          recordKpReaderPurePlanCacheHit(ownerWindow);
          // A pure-plan hit carries the exact protected-transit certificate;
          // the mounted session may attach current DOM but cannot recertify.
          recordKpReaderProtectedTransitCertificateReuse(ownerWindow);
        }
        const candidateSession =
          input.createSession({ ...sceneInput, purePlan });
        const committed = sessionHandoff.commit(handoffToken, () => {
          session = candidateSession;
          sessionKey = nextKey;
          structuralSessionKey = nextStructuralSessionKey;
          structuralFitSurface = frame.fitSurface;
        });
        if (!committed) {
          candidateSession.dispose();
          return false;
        }
        if (ownerWindow !== null) {
          recordKpReaderCanonicalSessionBuild(
            ownerWindow,
            ownerWindow.performance.now() - buildStartedAt
          );
        }
      } else {
        const ownerWindow = frame.fitSurface.ownerDocument.defaultView;
        if (ownerWindow !== null) {
          recordKpReaderCanonicalSessionReuse(ownerWindow);
        }
      }
      const activeSession = session;
      if (activeSession === undefined) {
        throw new Error(
          "Reader canonical equation session handoff committed no owner."
        );
      }
      const ownership = activeSession.apply(frame.progress);
      const ownerWindow = frame.fitSurface.ownerDocument.defaultView;
      if (ownerWindow !== null) {
        recordKpReaderCanonicalSessionApply(ownerWindow);
      }
      frame.fitSurface.dataset["kpReaderCanonicalEquationSession"] = "active";
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionLifecycle"] =
        activeSession.lifecycle;
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionOwner"] =
        ownership.visualOwner;
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionTrackCount"] =
        String(activeSession.tracks.length);
      // Presentation authority must remain inspectable in the mounted reader:
      // static compatibility checkpoints may not masquerade as verified motion.
      frame.fitSurface.dataset["kpReaderCanonicalEquationPresentationMode"] =
        activeSession.presentationMode;
      return true;
    },
    prewarm(frames) {
      // Prewarming is promoted exemplar-by-exemplar because presentation
      // style is part of a pure plan. Unreviewed families retain safe
      // synchronous cache misses rather than speculatively sharing styles.
      if (input.enableAdjacentPrewarm !== true) return;
      const firstWindow =
        frames[0]?.fitSurface.ownerDocument.defaultView ?? null;
      if (firstWindow === null) return;
      prewarmQueue ??= createKpReaderIdlePrewarmQueue({
        maximumPending: 2,
        clock: {
          request: (callback) =>
            typeof firstWindow.requestIdleCallback === "function"
              ? firstWindow.requestIdleCallback(callback, { timeout: 250 })
              : firstWindow.setTimeout(() => callback({
                  didTimeout: true,
                  timeRemaining: () => 0
                }), 0),
          cancel: (requestId) => {
            if (typeof firstWindow.cancelIdleCallback === "function") {
              firstWindow.cancelIdleCallback(requestId);
            } else {
              firstWindow.clearTimeout(requestId);
            }
          }
        }
      });
      prewarmQueue.replace(frames.flatMap((frame) => {
        const transitionId = frame.renderPlan.transitions[0]?.id;
        if (
          transitionId === undefined ||
          !transitionIds.includes(transitionId)
        ) {
          return [];
        }
        const geometryIdentity = geometryIdentityFor(frame, transitionId);
        return [{
          id: geometryIdentity.key,
          run: () => {
            if (purePlanCache.get(geometryIdentity) !== undefined) return;
            const sceneInput = purePlanInputFor(frame, transitionId, true);
            purePlanCache.set(
              geometryIdentity,
              input.compilePurePlan(sceneInput)
            );
            recordPureCompilation(firstWindow);
            recordKpReaderAdjacentPrewarmCompilation(firstWindow);
          }
        }];
      }));
    },
    invalidate() {
      sessionHandoff.invalidate();
      prewarmQueue?.cancel();
      releaseCurrentSession();
    },
    dispose() {
      sessionHandoff.invalidate();
      prewarmQueue?.dispose();
      releaseCurrentSession();
      purePlanCache.clear();
    }
  };
}

function bindReaderPaintOwnership(
  renderPlan: KpReaderEquationRenderPlan,
  materialPlan: KpReaderEquationMaterialPlan,
  fitSurface: HTMLElement
): void {
  const transitionId = fitSurface.closest<HTMLElement>(
    "[data-kp-reader-transition]"
  )?.dataset["kpReaderTransition"];
  const transition = materialPlan.transitions.find(
    (candidate) => candidate.transitionId === transitionId
  );
  const renderedTransition = renderPlan.transitions.find(
    ({ id }) => id === transitionId
  );
  if (transition === undefined || renderedTransition === undefined) {
    throw new Error("Reader canonical equation session is missing its material transition.");
  }
  for (const [side, states] of [
    ["source", renderedTransition.source],
    ["target", renderedTransition.target]
  ] as const) {
    const endpoint = requireDescendant<HTMLElement>(
      fitSurface,
      `[data-kp-reader-native="${side}"]`
    );
    for (const state of states) {
      const element = requireDescendant<HTMLElement>(
        endpoint,
        `[data-kp-reader-equation-state="${CSS.escape(state.objectId)}"]`
      );
      // State ownership is the truthful fallback for native KaTeX paint that
      // has no selector anchor; closer selector owners still take precedence.
      element.dataset["kpSemanticEntityId"] = state.objectId;
      element.dataset["kpPresentationGroupId"] =
        `reader-paint-state-group.${side}.${state.objectId}`;
    }
  }
  for (const anchor of transition.anchors) {
    const element = fitSurface.querySelector<HTMLElement>(
      `[data-kp-reader-equation-anchor-id="${CSS.escape(anchor.id)}"]`
    );
    if (element === null) {
      throw new Error(
        `Reader canonical equation session is missing anchor ${anchor.id}.`
      );
    }
    element.dataset["kpSemanticEntityId"] = anchor.selectorId;
    element.dataset["kpPresentationGroupId"] = `reader-paint-group.${anchor.id}`;
  }
}

function createMaterialLayer(fitSurface: HTMLElement): HTMLElement {
  const layer = fitSurface.ownerDocument.createElement("div");
  layer.className =
    "kp-reader-equation-material kp-reader-canonical-equation-session-material " +
    "kp-canonical-equation-content";
  layer.dataset["kpEditorEquationMaterialLayer"] = "true";
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("inert", "");
  fitSurface.append(layer);
  return layer;
}

function requireDescendant<T extends Element>(
  root: Element,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Expected ${selector}.`);
  return element;
}
