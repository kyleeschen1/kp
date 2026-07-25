import { syncKpEquationMaterialLayer } from "./equation-material-layer-dom.ts";
import { sampleKpEquationMaterialOwnerHandoff } from "./equation-material-owner.ts";
import type {
  KpNativeKatexFragmentObservation,
  KpStageRelativeRect
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

export interface KpNativeKatexGlyphFrame
  extends KpNativeKatexGlyphOwnershipFrame {
  readonly rect: KpStageRelativeRect;
  readonly targetHandoffDeltaPx: number;
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

export function applyKpNativeKatexGlyphFrame(input: {
  readonly clone: KpNativeKatexFragmentClone;
  readonly source: KpNativeKatexFragmentObservation;
  readonly target: KpNativeKatexFragmentObservation;
  readonly progress: number;
}): KpNativeKatexGlyphFrame {
  if (input.source.styleFingerprint !== input.target.styleFingerprint) {
    throw new Error(
      `Native fragment ${input.source.id} cannot hand off across typography drift.`
    );
  }
  const progress = clamp01(input.progress);
  const rect = interpolateRect(input.source.rect, input.target.rect, progress);
  Object.assign(input.clone.ownerElement.style, {
    position: "absolute",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: "none"
  });
  const ownership = applyKpNativeKatexGlyphOwnership({
    clone: input.clone,
    source: input.source,
    target: input.target,
    progress
  });
  return Object.freeze({
    ...ownership,
    rect,
    targetHandoffDeltaPx: rectDelta(rect, input.target.rect)
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

function interpolateRect(
  source: KpStageRelativeRect,
  target: KpStageRelativeRect,
  progress: number
): KpStageRelativeRect {
  return Object.freeze({
    left: lerp(source.left, target.left, progress),
    top: lerp(source.top, target.top, progress),
    width: lerp(source.width, target.width, progress),
    height: lerp(source.height, target.height, progress)
  });
}

function rectDelta(
  left: KpStageRelativeRect,
  right: KpStageRelativeRect
): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

function lerp(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Glyph progress must be finite.");
  return Math.max(0, Math.min(1, value));
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
