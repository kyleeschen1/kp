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

export interface KpNativeKatexContextReflowFrame {
  readonly translateX: number;
  readonly translateY: number;
  readonly departingOpacity: number;
}

export interface KpNativeKatexMultiplicityFrame {
  readonly visualOwner:
    | "source-native"
    | "source-natives"
    | "clone-transit"
    | "target-native"
    | "target-natives";
  readonly constituentFrames: readonly KpNativeKatexGlyphFrame[];
  readonly targetHandoffDeltaPx: number;
}

export interface KpNativeKatexCompositorDisposition {
  readonly kind: "native-katex-compositor-disposition";
  readonly lifecycle: "renderer-session";
  readonly mode: "motion" | "checkpoint-settlement";
  readonly reason: "clear" | "semantic-ambiguity" | "blocked-geometry";
  readonly affectedIds: readonly string[];
}

export function decideKpNativeKatexCompositorDisposition(input: {
  readonly ambiguities: readonly {
    readonly lineageGroupId: string;
  }[];
  readonly motions: readonly {
    readonly matchId: string;
    readonly status: "direct" | "clearance-route" | "settle";
  }[];
}): KpNativeKatexCompositorDisposition {
  if (input.ambiguities.length > 0) {
    return Object.freeze({
      kind: "native-katex-compositor-disposition",
      lifecycle: "renderer-session",
      mode: "checkpoint-settlement",
      reason: "semantic-ambiguity",
      affectedIds: Object.freeze([
        ...new Set(input.ambiguities.map(({ lineageGroupId }) => lineageGroupId))
      ])
    });
  }
  const blocked = input.motions
    .filter(({ status }) => status === "settle")
    .map(({ matchId }) => matchId);
  if (blocked.length > 0) {
    return Object.freeze({
      kind: "native-katex-compositor-disposition",
      lifecycle: "renderer-session",
      mode: "checkpoint-settlement",
      reason: "blocked-geometry",
      affectedIds: Object.freeze(blocked)
    });
  }
  return Object.freeze({
    kind: "native-katex-compositor-disposition",
    lifecycle: "renderer-session",
    mode: "motion",
    reason: "clear",
    affectedIds: Object.freeze([])
  });
}

export function createKpNativeKatexFragmentClone(input: {
  readonly stage: HTMLElement;
  readonly ownerId: string;
  readonly observation: KpNativeKatexFragmentObservation;
}): KpNativeKatexFragmentClone {
  return createKpNativeKatexFragmentClones({
    stage: input.stage,
    fragments: [{
      ownerId: input.ownerId,
      observation: input.observation
    }]
  })[0]!;
}

export function createKpNativeKatexFragmentClones(input: {
  readonly stage: HTMLElement;
  readonly fragments: readonly {
    readonly ownerId: string;
    readonly observation: KpNativeKatexFragmentObservation;
  }[];
}): readonly KpNativeKatexFragmentClone[] {
  const ownerIds = new Set<string>();
  for (const fragment of input.fragments) {
    if (
      fragment.observation.sourceElement.ownerDocument !==
      input.stage.ownerDocument
    ) {
      throw new Error("Native fragment clone requires one renderer document.");
    }
    if (ownerIds.has(fragment.ownerId)) {
      throw new Error(`Native fragment owner ${fragment.ownerId} is duplicated.`);
    }
    ownerIds.add(fragment.ownerId);
  }
  syncKpEquationMaterialLayer({
    stage: input.stage,
    owners: input.fragments.map(({ ownerId, observation }) => ({
      ownerId,
      sourceElement: observation.sourceElement,
      sourceMotionId: observation.motionId,
      rect: observation.rect,
      opacity: 1,
      transform: "none"
    }))
  });
  return Object.freeze(input.fragments.map(({ ownerId, observation }) => {
    const ownerElement = input.stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${CSS.escape(ownerId)}"]`
    );
    const visualElement = ownerElement?.firstElementChild;
    if (
      ownerElement === null ||
      !(visualElement instanceof HTMLElement)
    ) {
      throw new Error(`Material layer failed to create ${ownerId}.`);
    }
    makeVisualCloneInert(ownerElement, visualElement);
    return Object.freeze({
      kind: "native-katex-fragment-clone" as const,
      lifecycle: "renderer-session" as const,
      observationId: observation.id,
      ownerElement,
      visualElement
    });
  }));
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
  placeCloneAtRect(input.clone, rect);
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

export function applyKpNativeKatexManyToOneFrame(input: {
  readonly clones: readonly KpNativeKatexFragmentClone[];
  readonly sources: readonly KpNativeKatexFragmentObservation[];
  readonly target: KpNativeKatexFragmentObservation;
  readonly progress: number;
  readonly routeRects?: readonly KpStageRelativeRect[] | undefined;
}): KpNativeKatexMultiplicityFrame {
  if (input.sources.length < 2 || input.clones.length !== input.sources.length) {
    throw new Error(
      "Many-to-one native composition requires one clone per source and at least two sources."
    );
  }
  if (
    input.routeRects !== undefined &&
    input.routeRects.length !== input.sources.length
  ) {
    throw new Error("Many-to-one route geometry requires one rect per source.");
  }
  const linearFrames = input.sources.map((source, index) =>
    applyKpNativeKatexGlyphFrame({
      clone: input.clones[index]!,
      source,
      target: input.target,
      progress: input.progress
    })
  );
  const constituentFrames = input.routeRects === undefined
    ? linearFrames
    : linearFrames.map((frame, index) => {
        const rect = input.routeRects![index]!;
        placeCloneAtRect(input.clones[index]!, rect);
        return Object.freeze({
          ...frame,
          rect,
          targetHandoffDeltaPx: rectDelta(rect, input.target.rect)
        });
      });
  const visualOwner = constituentFrames[0]!.visualOwner === "source-native"
    ? "source-natives"
    : constituentFrames[0]!.visualOwner;
  return Object.freeze({
    visualOwner,
    constituentFrames: Object.freeze(constituentFrames),
    targetHandoffDeltaPx: Math.max(
      ...constituentFrames.map(({ targetHandoffDeltaPx }) =>
        targetHandoffDeltaPx
      )
    )
  });
}

export function applyKpNativeKatexOneToManyFrame(input: {
  readonly clones: readonly KpNativeKatexFragmentClone[];
  readonly source: KpNativeKatexFragmentObservation;
  readonly targets: readonly KpNativeKatexFragmentObservation[];
  readonly progress: number;
}): KpNativeKatexMultiplicityFrame {
  if (input.targets.length < 2 || input.clones.length !== input.targets.length) {
    throw new Error(
      "One-to-many native composition requires one clone per target and at least two targets."
    );
  }
  input.clones.forEach((clone, index) => {
    if (clone.observationId !== input.targets[index]!.id) {
      throw new Error(
        "One-to-many transit clones must use exact target-native fragments."
      );
    }
  });
  const constituentFrames = input.targets.map((target, index) =>
    applyKpNativeKatexGlyphFrame({
      clone: input.clones[index]!,
      source: input.source,
      target,
      progress: input.progress
    })
  );
  const constituentOwner = constituentFrames[0]!.visualOwner;
  return Object.freeze({
    visualOwner: constituentOwner === "target-native"
      ? "target-natives"
      : constituentOwner,
    constituentFrames: Object.freeze(constituentFrames),
    targetHandoffDeltaPx: Math.max(
      ...constituentFrames.map(({ targetHandoffDeltaPx }) =>
        targetHandoffDeltaPx
      )
    )
  });
}

export function applyKpNativeKatexContextReflow(input: {
  readonly persistentElement: HTMLElement;
  readonly persistentSourceRect: KpStageRelativeRect;
  readonly persistentTargetRect: KpStageRelativeRect;
  readonly departingElements: readonly HTMLElement[];
  readonly reflowProgress: number;
  readonly departureProgress: number;
  readonly departureLiftPx?: number | undefined;
}): KpNativeKatexContextReflowFrame {
  const reflow = smoothstep(clamp01(input.reflowProgress));
  const departure = smoothstep(clamp01(input.departureProgress));
  const translateX = reflow === 0
    ? 0
    : (input.persistentTargetRect.left - input.persistentSourceRect.left) *
      reflow;
  const translateY = reflow === 0
    ? 0
    : (input.persistentTargetRect.top - input.persistentSourceRect.top) *
      reflow;
  input.persistentElement.style.transform =
    `translate(${translateX}px, ${translateY}px)`;
  const departingOpacity = 1 - departure;
  const lift = (input.departureLiftPx ?? 8) * departure;
  for (const element of input.departingElements) {
    element.style.opacity = String(departingOpacity);
    element.style.transform = `translateY(${-lift}px)`;
  }
  return Object.freeze({
    translateX,
    translateY,
    departingOpacity
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

function placeCloneAtRect(
  clone: KpNativeKatexFragmentClone,
  rect: KpStageRelativeRect
): void {
  Object.assign(clone.ownerElement.style, {
    position: "absolute",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: "none"
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

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function makeVisualCloneInert(
  owner: HTMLElement,
  visual: HTMLElement
): void {
  owner.inert = true;
  owner.setAttribute("aria-hidden", "true");
  owner.style.pointerEvents = "none";
  owner.style.userSelect = "none";
  visual.style.inset = "0";
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
