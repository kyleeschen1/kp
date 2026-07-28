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
  recordKpReaderCanonicalSessionApply,
  recordKpReaderCanonicalSessionBuild,
  recordKpReaderCanonicalSessionReuse
} from "../runtime/public-api.ts";

export interface KpReaderCanonicalEquationSession {
  readonly transitionIds: readonly string[];
  readonly apply: (input: {
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
  }) => boolean;
  readonly invalidate: () => void;
  readonly dispose: () => void;
}

export function createKpReaderCanonicalEquationSession(input: {
  readonly transitionIds: readonly string[];
  readonly createSession: KpReaderEquationSceneCompositorFactory;
  readonly compilePurePlan: KpReaderEquationPureScenePlanCompiler;
  readonly requireAppliedStageLayout?: boolean | undefined;
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
        const source = observeKpNativeKatexRenderedScene({
          endpoint: "source",
          stage: frame.fitSurface,
          root: sourceRoot,
          semanticEntityId: `${transitionId}.source`,
          presentationGroupId: `${transitionId}.source`,
          fontReadiness: frame.fontReadiness
        });
        const target = observeKpNativeKatexRenderedScene({
          endpoint: "target",
          stage: frame.fitSurface,
          root: targetRoot,
          semanticEntityId: `${transitionId}.target`,
          presentationGroupId: `${transitionId}.target`,
          fontReadiness: frame.fontReadiness
        });
        const sceneInput = {
          renderPlan: frame.renderPlan,
          materialPlan: frame.materialPlan,
          transitionId,
          motionMode: frame.motionMode,
          measurementIdentity: frame.measurementIdentity,
          ...(frame.appliedStageLayout === undefined
            ? {}
            : { stageLayout: frame.appliedStageLayout.certificate }),
          source,
          target
        };
        const purePlan = input.compilePurePlan(sceneInput);
        session = input.createSession({ ...sceneInput, purePlan });
        sessionKey = nextKey;
        structuralSessionKey = nextStructuralSessionKey;
        structuralFitSurface = frame.fitSurface;
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
      const ownership = session.apply(frame.progress);
      const ownerWindow = frame.fitSurface.ownerDocument.defaultView;
      if (ownerWindow !== null) {
        recordKpReaderCanonicalSessionApply(ownerWindow);
      }
      frame.fitSurface.dataset["kpReaderCanonicalEquationSession"] = "active";
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionLifecycle"] =
        session.lifecycle;
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionOwner"] =
        ownership.visualOwner;
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionTrackCount"] =
        String(session.tracks.length);
      return true;
    },
    invalidate: releaseCurrentSession,
    dispose: releaseCurrentSession
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
