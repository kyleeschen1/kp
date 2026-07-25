import { syncKpEquationMaterialLayer } from "./equation-material-layer-dom.ts";
import { sampleKpEquationMaterialOwnerHandoff } from "./equation-material-owner.ts";
import type {
  KpNativeKatexFragmentObservation
} from "./native-katex-fragment-observer.ts";

export interface KpNativeKatexFragmentClone {
  readonly kind: "native-katex-fragment-clone";
  readonly lifecycle: "renderer-session";
  readonly observationId: string;
  readonly ownerElement: HTMLElement;
  readonly visualElement: HTMLElement;
}

export type KpNativeKatexGlyphVisualOwner =
  | "source-native"
  | "clone-transit"
  | "target-native";

export interface KpNativeKatexGlyphOwnershipFrame {
  readonly visualOwner: KpNativeKatexGlyphVisualOwner;
  readonly sourceNativeOpacity: number;
  readonly cloneOpacity: number;
  readonly targetNativeOpacity: number;
}

export function createKpNativeKatexFragmentClone(input: {
  readonly stage: HTMLElement;
  readonly ownerId: string;
  readonly observation: KpNativeKatexFragmentObservation;
}): KpNativeKatexFragmentClone {
  if (input.observation.sourceElement.ownerDocument !== input.stage.ownerDocument) {
    throw new Error("Native fragment clone requires one renderer document.");
  }
  syncKpEquationMaterialLayer({
    stage: input.stage,
    owners: [{
      ownerId: input.ownerId,
      sourceElement: input.observation.sourceElement,
      sourceMotionId: input.observation.motionId,
      rect: input.observation.rect,
      opacity: 1,
      transform: "none"
    }]
  });
  const ownerElement = input.stage.querySelector<HTMLElement>(
    `[data-kp-equation-material-owner-id="${CSS.escape(input.ownerId)}"]`
  );
  const visualElement = ownerElement?.firstElementChild;
  if (
    ownerElement === null ||
    !(visualElement instanceof HTMLElement)
  ) {
    throw new Error(`Material layer failed to create ${input.ownerId}.`);
  }
  makeVisualCloneInert(ownerElement, visualElement);
  return Object.freeze({
    kind: "native-katex-fragment-clone",
    lifecycle: "renderer-session",
    observationId: input.observation.id,
    ownerElement,
    visualElement
  });
}

export function applyKpNativeKatexGlyphOwnership(input: {
  readonly clone: KpNativeKatexFragmentClone;
  readonly source: KpNativeKatexFragmentObservation;
  readonly target: KpNativeKatexFragmentObservation;
  readonly progress: number;
}): KpNativeKatexGlyphOwnershipFrame {
  const handoff = sampleKpEquationMaterialOwnerHandoff({
    ownerId: input.clone.ownerElement.dataset["kpEquationMaterialOwnerId"] ?? "",
    progress: input.progress,
    sourcePresent: true,
    targetPresent: true,
    handoffMode: "atomic-v1"
  });
  input.source.sourceElement.style.opacity = String(
    handoff.sourceNativeOpacity
  );
  input.clone.ownerElement.style.opacity = String(handoff.materialOpacity);
  input.target.sourceElement.style.opacity = String(
    handoff.targetNativeOpacity
  );
  const visualOwner: KpNativeKatexGlyphVisualOwner =
    handoff.nativeHandoff === "source"
      ? "source-native"
      : handoff.nativeHandoff === "target"
        ? "target-native"
        : "clone-transit";
  input.clone.ownerElement.dataset["kpNativeKatexVisualOwner"] = visualOwner;
  return Object.freeze({
    visualOwner,
    sourceNativeOpacity: handoff.sourceNativeOpacity,
    cloneOpacity: handoff.materialOpacity,
    targetNativeOpacity: handoff.targetNativeOpacity
  });
}

function makeVisualCloneInert(
  owner: HTMLElement,
  visual: HTMLElement
): void {
  owner.inert = true;
  owner.setAttribute("aria-hidden", "true");
  owner.style.pointerEvents = "none";
  owner.style.userSelect = "none";
  for (const element of [visual, ...visual.querySelectorAll<HTMLElement>("*")]) {
    for (const attribute of [...element.attributes]) {
      if (
        attribute.name === "id" ||
        attribute.name === "role" ||
        attribute.name === "tabindex" ||
        attribute.name === "contenteditable" ||
        attribute.name.startsWith("aria-") ||
        attribute.name.startsWith("data-kp-")
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}
