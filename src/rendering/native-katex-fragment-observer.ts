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

function requireText(value: string, path: string): void {
  if (value.trim().length === 0) throw new Error(`${path} is required.`);
}
