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
  type KpReaderEquationSymbolMotionFrame
} from "../renderers/public-api.ts";

interface PaintBinding {
  readonly ownerId: string;
  readonly endpoint: "source" | "target";
  readonly semanticEntityId: string;
  readonly rect: { readonly left: number; readonly top: number;
    readonly width: number; readonly height: number };
}

export interface KpReaderCanonicalEquationSession {
  readonly transitionId: string;
  readonly apply: (input: {
    readonly renderPlan: KpReaderEquationRenderPlan;
    readonly materialPlan: KpReaderEquationMaterialPlan;
    readonly fitSurface: HTMLElement;
    readonly progress: number;
    readonly fontReadiness: KpEquationFontReadiness;
    readonly motion: KpReaderEquationSymbolMotionFrame;
  }) => boolean;
  readonly invalidate: () => void;
  readonly dispose: () => void;
}

export function createKpReaderCanonicalEquationSession(input: {
  readonly transitionId: string;
  readonly createSession: KpReaderEquationSceneCompositorFactory;
}): KpReaderCanonicalEquationSession {
  let session:
    ReturnType<KpReaderEquationSceneCompositorFactory> | undefined;
  let sessionKey: string | undefined;
  let materialLayer: HTMLElement | undefined;
  let paintBindings: readonly PaintBinding[] = [];

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
        const atomsById = new Map([...source.atoms, ...target.atoms].map(
          (atom) => [atom.id, atom]
        ));
        paintBindings = session.tracks.map((track) => {
          const atom = atomsById.get(track.visualAtomId)!;
          return {
            ownerId: `native-scene-owner.${track.id}`,
            endpoint: atom.endpoint,
            semanticEntityId: atom.semanticEntityId,
            rect: atom.rect
          };
        });
        sessionKey = nextKey;
      }
      const ownership = session.apply(frame.progress);
      if (ownership.materialSceneOpacity === 1) {
        applyReaderMotionTrace(frame, paintBindings, input.transitionId);
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
    invalidate: () => {
      session = undefined;
      sessionKey = undefined;
      paintBindings = [];
    },
    dispose: () => {
      session = undefined;
      sessionKey = undefined;
      paintBindings = [];
      materialLayer?.remove();
      materialLayer = undefined;
    }
  };
}

function applyReaderMotionTrace(
  frame: {
    readonly materialPlan: KpReaderEquationMaterialPlan;
    readonly fitSurface: HTMLElement;
    readonly motion: KpReaderEquationSymbolMotionFrame;
  },
  bindings: readonly PaintBinding[],
  transitionId: string
): void {
  const transition = frame.materialPlan.transitions.find(
    (candidate) => candidate.transitionId === transitionId
  );
  if (transition === undefined) return;
  const anchors = new Map(transition.anchors.map((anchor) => [
    `${anchor.side}:${anchor.selectorId}`,
    anchor.id
  ]));
  const poses = new Map(frame.motion.owners.flatMap((owner) =>
    owner.fragmentPoses.map((fragment) => [
      fragment.anchorId,
      { materialOpacity: owner.materialOpacity, pose: fragment.pose }
    ] as const)
  ));
  for (const binding of bindings) {
    const anchorId = anchors.get(
      `${binding.endpoint}:${binding.semanticEntityId}`
    );
    const guided = anchorId === undefined ? undefined : poses.get(anchorId);
    if (guided === undefined) continue;
    const owner = frame.fitSurface.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${CSS.escape(binding.ownerId)}"]`
    );
    if (owner === null) continue;
    const { pose, materialOpacity } = guided;
    const depth = pose.depth;
    owner.style.left = `${binding.rect.left}px`;
    owner.style.top = `${binding.rect.top}px`;
    owner.style.width = `${binding.rect.width}px`;
    owner.style.height = `${binding.rect.height}px`;
    owner.style.opacity = String(materialOpacity * pose.opacity);
    owner.style.transformOrigin = "center center";
    owner.style.transform =
      `translate(${pose.x}px, ${pose.y + (depth?.translateY ?? 0)}px) ` +
      `rotate(${pose.rotate ?? 0}deg) ` +
      `scale(${pose.scaleX ?? pose.scale}, ${pose.scale})`;
    owner.style.filter = depth === undefined || depth.shadowOpacity === 0
      ? "none"
      : `drop-shadow(0 1px ${depth.shadowBlurPx}px ` +
        `rgba(35, 46, 58, ${depth.shadowOpacity}))`;
    owner.style.zIndex = String(depth?.layer ?? 0);
    owner.dataset["kpReaderMotionGuided"] = "true";
    if (depth === undefined) {
      delete owner.dataset["kpReaderEquationSemanticDepth"];
    } else {
      owner.dataset["kpReaderEquationSemanticDepth"] =
        String(depth.elevation);
    }
  }
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
    throw new Error("Reader canonical equation session is missing its material transition.");
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
    "kp-reader-equation-material kp-reader-canonical-equation-session-material";
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
