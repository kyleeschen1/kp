import {
  createKpEquationFontReadiness
} from "./equation-font-readiness.ts";
import {
  createKpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame,
  type KpNativeKatexRendererSession
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexSuccessorSynthesisIntent
} from "./native-katex-successor-synthesis.ts";
import {
  observeKpNativeKatexRenderedScene
} from "./native-katex-rendered-scene.ts";

export interface KpPlaceValueNativeSceneDom {
  readonly root: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly prepare: () => void;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly dispose: () => void;
}

/**
 * Place-value beats differ in semantics, not renderer lifecycle. This adapter
 * supplies the one measured native-scene stage required by the canonical
 * compositor so later columns cannot invent their own clone layer or handoff.
 */
export function createKpPlaceValueNativeSceneDom(input: {
  readonly document: Document;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly sourceSceneId: string;
  readonly targetSceneId: string;
  readonly successorSyntheses:
    readonly KpNativeKatexSuccessorSynthesisIntent[];
}): KpPlaceValueNativeSceneDom {
  const root = input.document.createElement("div");
  root.dataset["kpPlaceValueNativeScene"] = "";
  root.style.cssText =
    "display:grid;position:relative;width:100%;place-items:center";
  root.setAttribute("aria-hidden", "true");

  input.sourceRoot.dataset["kpPlaceValueOperationEndpoint"] = "source";
  input.targetRoot.dataset["kpPlaceValueOperationEndpoint"] = "target";
  input.targetRoot.style.cssText +=
    ";position:absolute;inset:0;opacity:0";
  namespaceTransientIds(input.sourceRoot, `${input.sourceSceneId}.source`);
  namespaceTransientIds(input.targetRoot, `${input.targetSceneId}.target`);

  const materialLayer = input.document.createElement("div");
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.style.cssText =
    "position:absolute;inset:0;pointer-events:none";
  root.append(input.sourceRoot, input.targetRoot, materialLayer);

  const fontReadiness = createKpEquationFontReadiness(input.document);
  let renderer: KpNativeKatexRendererSession | undefined;
  const requireRenderer = (): KpNativeKatexRendererSession => {
    if (renderer !== undefined) return renderer;
    if (!root.isConnected) {
      throw new Error(
        "Place-value native scene must be connected before paint measurement."
      );
    }
    const source = observeKpNativeKatexRenderedScene({
      endpoint: "source",
      stage: root,
      root: input.sourceRoot,
      semanticEntityId: input.sourceSceneId,
      presentationGroupId: input.sourceSceneId,
      fontReadiness
    });
    const target = observeKpNativeKatexRenderedScene({
      endpoint: "target",
      stage: root,
      root: input.targetRoot,
      semanticEntityId: input.targetSceneId,
      presentationGroupId: input.targetSceneId,
      fontReadiness
    });
    renderer = createKpCanonicalNativeKatexSceneSession({
      source,
      target,
      relations: [],
      successorSyntheses: input.successorSyntheses
    }).session;
    return renderer;
  };

  return Object.freeze({
    root,
    sourceRoot: input.sourceRoot,
    targetRoot: input.targetRoot,
    prepare() {
      requireRenderer();
    },
    apply(progress: number) {
      return requireRenderer().apply(progress);
    },
    dispose() {
      renderer?.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason: "surface-disposed",
        structuralSuccession: "retire-preserving-paint"
      });
      fontReadiness.dispose();
    }
  });
}

function namespaceTransientIds(root: HTMLElement, prefix: string): void {
  for (const element of [
    ...(root.id === "" ? [] : [root]),
    ...root.querySelectorAll<HTMLElement>("[id]")
  ]) {
    // Multiple mounted endpoint scenes intentionally repeat semantic IDs, but
    // document IDs must remain unique for accessibility and browser lookup.
    element.id = `${prefix}.${element.id}`;
  }
}
