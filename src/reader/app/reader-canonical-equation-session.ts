import {
  observeKpNativeKatexRenderedScene
} from "../../rendering/native-katex-rendered-scene.ts";
import type {
  KpEquationFontReadiness
} from "../../rendering/equation-font-readiness.ts";
import {
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationRenderPlan,
  type KpReaderEquationSceneCompositorFactory
} from "../renderers/public-api.ts";

export interface KpReaderCanonicalEquationSession {
  readonly transitionIds: readonly string[];
  readonly apply: (input: {
    readonly renderPlan: KpReaderEquationRenderPlan;
    readonly materialPlan: KpReaderEquationMaterialPlan;
    readonly fitSurface: HTMLElement;
    readonly progress: number;
    readonly fontReadiness: KpEquationFontReadiness;
    readonly presentationRevision: string;
  }) => boolean;
  readonly invalidate: () => void;
  readonly dispose: () => void;
}

export function createKpReaderCanonicalEquationSession(input: {
  readonly transitionIds: readonly string[];
  readonly createSession: KpReaderEquationSceneCompositorFactory;
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
  let materialLayer: HTMLElement | undefined;

  return {
    transitionIds,
    apply: (frame) => {
      const transitionId = frame.renderPlan.transitions[0]?.id;
      if (
        transitionId === undefined ||
        !transitionIds.includes(transitionId)
      ) return false;
      const nextKey = [
        transitionId,
        frame.renderPlan.id,
        frame.materialPlan.id,
        frame.presentationRevision,
        frame.fontReadiness.revision,
        frame.fitSurface.offsetWidth,
        frame.fitSurface.offsetHeight
      ].join(":");
      if (session === undefined || sessionKey !== nextKey) {
        materialLayer?.remove();
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
        session = input.createSession({
          renderPlan: frame.renderPlan,
          materialPlan: frame.materialPlan,
          transitionId,
          source,
          target
        });
        sessionKey = nextKey;
      }
      const ownership = session.apply(frame.progress);
      frame.fitSurface.dataset["kpReaderCanonicalEquationSession"] = "active";
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionLifecycle"] =
        session.lifecycle;
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionOwner"] =
        ownership.visualOwner;
      frame.fitSurface.dataset["kpReaderCanonicalEquationSessionTrackCount"] =
        String(session.tracks.length);
      return true;
    },
    invalidate: () => {
      session = undefined;
      sessionKey = undefined;
    },
    dispose: () => {
      session = undefined;
      sessionKey = undefined;
      materialLayer?.remove();
      materialLayer = undefined;
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
