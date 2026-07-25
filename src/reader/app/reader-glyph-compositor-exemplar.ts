import {
  observeKpNativeKatexRenderedScene
} from "../../rendering/native-katex-rendered-scene.ts";
import type {
  KpEquationFontReadiness
} from "../../rendering/equation-font-readiness.ts";
import {
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationRenderPlan,
  type KpReaderEquationSceneCompositorFactory,
  type KpReaderEquationSceneCompositorSession
} from "../renderers/public-api.ts";

export interface KpReaderGlyphCompositorExemplar {
  readonly transitionId: string;
  readonly apply: (input: {
    readonly renderPlan: KpReaderEquationRenderPlan;
    readonly materialPlan: KpReaderEquationMaterialPlan;
    readonly fitSurface: HTMLElement;
    readonly progress: number;
    readonly fontReadiness: KpEquationFontReadiness;
  }) => boolean;
  readonly invalidate: () => void;
  readonly dispose: () => void;
}

export function createKpReaderGlyphCompositorExemplar(input: {
  readonly transitionId: string;
  readonly createSession: KpReaderEquationSceneCompositorFactory;
}): KpReaderGlyphCompositorExemplar {
  let session: KpReaderEquationSceneCompositorSession | undefined;
  let sessionKey: string | undefined;
  let materialLayer: HTMLElement | undefined;

  return {
    transitionId: input.transitionId,
    apply: (frame) => {
      if (frame.renderPlan.transitions[0]?.id !== input.transitionId) return false;
      const nextKey = [
        frame.renderPlan.id,
        frame.materialPlan.id,
        frame.fontReadiness.revision,
        frame.fitSurface.offsetWidth,
        frame.fitSurface.offsetHeight
      ].join(":");
      if (session === undefined || sessionKey !== nextKey) {
        materialLayer?.remove();
        materialLayer = createMaterialLayer(frame.fitSurface);
        bindReaderPaintOwnership(frame.materialPlan, frame.fitSurface);
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
          semanticEntityId: `${input.transitionId}.source`,
          presentationGroupId: `${input.transitionId}.source`,
          fontReadiness: frame.fontReadiness
        });
        const target = observeKpNativeKatexRenderedScene({
          endpoint: "target",
          stage: frame.fitSurface,
          root: targetRoot,
          semanticEntityId: `${input.transitionId}.target`,
          presentationGroupId: `${input.transitionId}.target`,
          fontReadiness: frame.fontReadiness
        });
        session = input.createSession({
          renderPlan: frame.renderPlan,
          materialPlan: frame.materialPlan,
          transitionId: input.transitionId,
          source,
          target
        });
        sessionKey = nextKey;
      }
      const ownership = session.playback.apply(frame.progress);
      frame.fitSurface.dataset["kpReaderGlyphCompositor"] = "active";
      frame.fitSurface.dataset["kpReaderGlyphCompositorLifecycle"] =
        session.lifecycle;
      frame.fitSurface.dataset["kpReaderGlyphCompositorOwner"] =
        ownership.visualOwner;
      frame.fitSurface.dataset["kpReaderGlyphCompositorTrackCount"] =
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
  materialPlan: KpReaderEquationMaterialPlan,
  fitSurface: HTMLElement
): void {
  const transition = materialPlan.transitions.find(
    ({ transitionId }) =>
      transitionId === fitSurface.closest<HTMLElement>(
        "[data-kp-reader-transition]"
      )?.dataset["kpReaderTransition"]
  );
  if (transition === undefined) {
    throw new Error("Reader glyph compositor is missing its material transition.");
  }
  for (const anchor of transition.anchors) {
    const element = fitSurface.querySelector<HTMLElement>(
      `[data-kp-reader-equation-anchor-id="${CSS.escape(anchor.id)}"]`
    );
    if (element === null) {
      throw new Error(`Reader glyph compositor is missing anchor ${anchor.id}.`);
    }
    element.dataset["kpSemanticEntityId"] = anchor.selectorId;
    element.dataset["kpPresentationGroupId"] = `reader-paint-group.${anchor.id}`;
  }
}

function createMaterialLayer(fitSurface: HTMLElement): HTMLElement {
  const layer = fitSurface.ownerDocument.createElement("div");
  layer.className =
    "kp-reader-equation-material kp-reader-glyph-compositor-material";
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
