import type { KpDevReviewSemanticTargetV1 } from "../../protocols/dev-review-v1.ts";

const semanticAttributes = Object.freeze({
  selectorId: "data-kp-reader-selector-id",
  objectId: "data-kp-reader-equation-state",
  transformationId: "data-kp-reader-transition",
  materialOwnerId: "data-kp-equation-material-owner-id"
});

const semanticSelector = Object.values(semanticAttributes)
  .map((attribute) => `[${attribute}]`)
  .join(",");

export interface KpDevReviewPointerGeometry {
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
}

export interface KpDevReviewSemanticTargetInput {
  readonly ids: Pick<
    KpDevReviewSemanticTargetV1,
    "selectorId" | "objectId" | "transformationId" | "materialOwnerId"
  >;
  readonly rect: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly point: KpDevReviewPointerGeometry;
}

export function captureKpDevReviewSemanticTarget(
  eventTarget: EventTarget | null,
  point: KpDevReviewPointerGeometry
): KpDevReviewSemanticTargetV1 | undefined {
  const element = eventTarget instanceof Element
    ? eventTarget
    : eventTarget instanceof Node
      ? eventTarget.parentElement
      : null;
  if (element === null) return undefined;
  const anchor = element?.closest<Element>(semanticSelector);
  if (anchor === null || anchor === undefined) return undefined;

  const rect = anchor.getBoundingClientRect();
  return deriveKpDevReviewSemanticTarget({
    ids: readClosestSemanticIds(element),
    rect,
    point
  });
}

export function deriveKpDevReviewSemanticTarget(
  input: KpDevReviewSemanticTargetInput
): KpDevReviewSemanticTargetV1 {
  return {
    ...input.ids,
    normalizedPoint: {
      x: normalizeCoordinate(input.point.clientX, input.rect.left, input.rect.width),
      y: normalizeCoordinate(input.point.clientY, input.rect.top, input.rect.height)
    },
    viewportRect: {
      left: input.rect.left,
      top: input.rect.top,
      width: input.rect.width,
      height: input.rect.height
    },
    pagePoint: { x: input.point.pageX, y: input.point.pageY }
  };
}

function readClosestSemanticIds(element: Element): Pick<
  KpDevReviewSemanticTargetV1,
  "selectorId" | "objectId" | "transformationId" | "materialOwnerId"
> {
  const result: {
    selectorId?: string;
    objectId?: string;
    transformationId?: string;
    materialOwnerId?: string;
  } = {};
  for (const [field, attribute] of Object.entries(semanticAttributes)) {
    const value = element.closest(`[${attribute}]`)?.getAttribute(attribute);
    if (value !== null && value !== undefined && value.length > 0) {
      result[field as keyof typeof result] = value;
    }
  }
  return result;
}

function normalizeCoordinate(value: number, start: number, size: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(start) || !Number.isFinite(size) || size <= 0) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, (value - start) / size));
}
