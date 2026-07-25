import type {
  KpEquationFontReadiness
} from "./equation-font-readiness.ts";

export interface KpStageRelativeRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpNativeKatexFragmentObservation {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly motionId: string;
  readonly glyphKey: string;
  readonly sourceElement: HTMLElement;
  readonly rect: KpStageRelativeRect;
  readonly styleFingerprint: string;
  readonly fontRevision: number;
}

export interface KpNativeKatexFragmentObservationBatch {
  readonly kind: "native-katex-fragment-observation-batch";
  readonly lifecycle: "renderer-session";
  readonly stage: HTMLElement;
  readonly fragments: readonly KpNativeKatexFragmentObservation[];
}

export interface KpNativeKatexFragmentBinding {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly motionId: string;
  readonly glyphKey: string;
}

export interface KpClientRectSnapshot {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

const fingerprintProperties = [
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "transform",
  "vertical-align"
] as const;

export function observeKpNativeKatexFragments(input: {
  readonly stage: HTMLElement;
  readonly bindings: readonly KpNativeKatexFragmentBinding[];
  readonly fontRevision: number;
}): KpNativeKatexFragmentObservationBatch {
  const stageRect = input.stage.getBoundingClientRect();
  const stageLayout = {
    width: input.stage.offsetWidth || stageRect.width,
    height: input.stage.offsetHeight || stageRect.height
  };
  const fragments = input.bindings.map((binding) => {
    const matches = input.stage.querySelectorAll<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(binding.motionId)}"]`
    );
    if (matches.length !== 1) {
      throw new Error(
        `Motion node ${binding.motionId} resolved to ${matches.length} rendered fragments; exactly one explicit node is required.`
      );
    }
    const sourceElement = matches[0]!;
    const rect = normalizeKpStageRelativeRect({
      stageClientRect: stageRect,
      stageLayoutWidth: stageLayout.width,
      stageLayoutHeight: stageLayout.height,
      fragmentClientRect: sourceElement.getBoundingClientRect()
    });
    const computed = getComputedStyle(sourceElement);
    return {
      ...binding,
      sourceElement,
      rect,
      styleFingerprint: fingerprintProperties.map((property) =>
        `${property}:${computed.getPropertyValue(property)}`
      ).join("|"),
      fontRevision: input.fontRevision
    };
  });
  return createKpNativeKatexFragmentObservationBatch({
    stage: input.stage,
    fragments
  });
}

export async function settleAndObserveKpNativeKatexFragments(input: {
  readonly stage: HTMLElement;
  readonly bindings: readonly KpNativeKatexFragmentBinding[];
  readonly fontReadiness: KpEquationFontReadiness;
  readonly geometryTolerancePx?: number | undefined;
}): Promise<KpNativeKatexFragmentObservationBatch> {
  await input.fontReadiness.whenReady();
  await nextLayoutFrame(input.stage.ownerDocument);
  const first = observeKpNativeKatexFragments({
    stage: input.stage,
    bindings: input.bindings,
    fontRevision: input.fontReadiness.revision
  });
  await nextLayoutFrame(input.stage.ownerDocument);
  const second = observeKpNativeKatexFragments({
    stage: input.stage,
    bindings: input.bindings,
    fontRevision: input.fontReadiness.revision
  });
  const tolerance = input.geometryTolerancePx ?? 0.25;
  first.fragments.forEach((fragment, index) => {
    const settled = second.fragments[index]!;
    if (
      fragment.styleFingerprint !== settled.styleFingerprint ||
      rectDelta(fragment.rect, settled.rect) > tolerance
    ) {
      throw new Error(
        `Native fragment ${fragment.id} did not settle across consecutive layout frames.`
      );
    }
  });
  return second;
}

export function normalizeKpStageRelativeRect(input: {
  readonly stageClientRect: KpClientRectSnapshot;
  readonly stageLayoutWidth: number;
  readonly stageLayoutHeight: number;
  readonly fragmentClientRect: KpClientRectSnapshot;
}): KpStageRelativeRect {
  if (
    !Number.isFinite(input.stageLayoutWidth) ||
    !Number.isFinite(input.stageLayoutHeight) ||
    input.stageLayoutWidth <= 0 ||
    input.stageLayoutHeight <= 0 ||
    input.stageClientRect.width <= 0 ||
    input.stageClientRect.height <= 0
  ) {
    throw new Error("Native fragment stage requires positive settled geometry.");
  }
  const scaleX = input.stageClientRect.width / input.stageLayoutWidth;
  const scaleY = input.stageClientRect.height / input.stageLayoutHeight;
  return Object.freeze({
    left:
      (input.fragmentClientRect.left - input.stageClientRect.left) / scaleX,
    top:
      (input.fragmentClientRect.top - input.stageClientRect.top) / scaleY,
    width: input.fragmentClientRect.width / scaleX,
    height: input.fragmentClientRect.height / scaleY
  });
}

export function createKpNativeKatexFragmentObservationBatch(input: {
  readonly stage: HTMLElement;
  readonly fragments: readonly KpNativeKatexFragmentObservation[];
}): KpNativeKatexFragmentObservationBatch {
  const ids = new Set<string>();
  const fragments = input.fragments.map((fragment, index) => {
    requireText(fragment.id, `fragments[${index}].id`);
    requireText(
      fragment.semanticEntityId,
      `fragments[${index}].semanticEntityId`
    );
    requireText(fragment.motionId, `fragments[${index}].motionId`);
    requireText(fragment.glyphKey, `fragments[${index}].glyphKey`);
    requireText(
      fragment.styleFingerprint,
      `fragments[${index}].styleFingerprint`
    );
    if (ids.has(fragment.id)) {
      throw new Error(`Native fragment id ${fragment.id} is duplicated.`);
    }
    if (
      !Number.isInteger(fragment.fontRevision) ||
      fragment.fontRevision < 0
    ) {
      throw new Error(
        `fragments[${index}].fontRevision must be a non-negative integer.`
      );
    }
    validateRect(fragment.rect, `fragments[${index}].rect`);
    if (fragment.sourceElement.ownerDocument !== input.stage.ownerDocument) {
      throw new Error(
        `fragments[${index}].sourceElement must share the stage document.`
      );
    }
    ids.add(fragment.id);
    return Object.freeze({
      ...fragment,
      rect: Object.freeze({ ...fragment.rect })
    });
  });
  return Object.freeze({
    kind: "native-katex-fragment-observation-batch",
    lifecycle: "renderer-session",
    stage: input.stage,
    fragments: Object.freeze(fragments)
  });
}

function validateRect(rect: KpStageRelativeRect, path: string): void {
  for (const [key, value] of Object.entries(rect)) {
    if (!Number.isFinite(value)) {
      throw new Error(`${path}.${key} must be finite.`);
    }
  }
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error(`${path} requires positive width and height.`);
  }
}

function nextLayoutFrame(ownerDocument: Document): Promise<void> {
  const view = ownerDocument.defaultView;
  if (view === null) return Promise.resolve();
  return new Promise((resolve) => view.requestAnimationFrame(() => resolve()));
}

function rectDelta(left: KpStageRelativeRect, right: KpStageRelativeRect): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

function requireText(value: string, path: string): void {
  if (value.trim().length === 0) throw new Error(`${path} is required.`);
}
