import {
  measureKpNativeKatexBaselineY,
  measureKpNativeKatexSubtreePaintRect,
  measureKpNativeKatexTextInkRect
} from "../../src/rendering/native-katex-paint-geometry.ts";
import type { KpStageRelativeRect } from
  "../../src/rendering/native-katex-fragment-observer.ts";
import type { KpNativeKatexConformanceShapeDescriptor } from
  "./native-katex-compositor-conformance-schema.ts";

export interface KpNativeKatexConformanceVisibleInkObservation {
  readonly kind: "native-katex-conformance-visible-ink";
  readonly measurementAuthority: "realized-paint";
  readonly coordinateSpace: "stage-layout-px";
  readonly shapeId: KpNativeKatexConformanceShapeDescriptor["id"];
  readonly semanticEntityId: string;
  readonly rect: KpStageRelativeRect;
  readonly baselineY: number | null;
  readonly effectiveOpacity: number;
}

export interface KpNativeKatexConformancePaintMeasurementPort {
  readonly measureTextInkRect: (
    stage: HTMLElement,
    element: HTMLElement
  ) => KpStageRelativeRect;
  readonly measureSubtreePaintRect: (
    stage: HTMLElement,
    element: HTMLElement
  ) => KpStageRelativeRect | undefined;
  readonly measureBaselineY: (
    stage: HTMLElement,
    element: HTMLElement
  ) => number;
  readonly measureEffectiveOpacity: (
    stage: HTMLElement,
    element: HTMLElement
  ) => number;
}

const browserPaintMeasurementPort:
KpNativeKatexConformancePaintMeasurementPort = Object.freeze({
  measureTextInkRect: measureKpNativeKatexTextInkRect,
  measureSubtreePaintRect: measureKpNativeKatexSubtreePaintRect,
  measureBaselineY: measureKpNativeKatexBaselineY,
  measureEffectiveOpacity: measureEffectiveOpacity
});

export function observeKpNativeKatexConformanceVisibleInk(input: {
  readonly stage: HTMLElement;
  readonly element: HTMLElement;
  readonly descriptor: KpNativeKatexConformanceShapeDescriptor;
  readonly semanticEntityId: string;
  readonly measurementPort?:
    KpNativeKatexConformancePaintMeasurementPort | undefined;
}): KpNativeKatexConformanceVisibleInkObservation {
  if (input.semanticEntityId.trim() === "") {
    throw new Error("Visible-ink observation requires a semantic entity ID.");
  }
  const port = input.measurementPort ?? browserPaintMeasurementPort;
  const rect = measureVisibleRect(input, port);
  const baselineY = input.descriptor.baseline === "required"
    ? port.measureBaselineY(input.stage, input.element)
    : null;
  const effectiveOpacity = port.measureEffectiveOpacity(
    input.stage,
    input.element
  );
  requireFiniteRect(rect);
  if (baselineY !== null && !Number.isFinite(baselineY)) {
    throw new Error("Visible-ink baseline must be finite.");
  }
  if (
    !Number.isFinite(effectiveOpacity) ||
    effectiveOpacity < 0 ||
    effectiveOpacity > 1
  ) {
    throw new Error("Visible-ink opacity must be within zero and one.");
  }
  return Object.freeze({
    kind: "native-katex-conformance-visible-ink" as const,
    measurementAuthority: "realized-paint" as const,
    coordinateSpace: "stage-layout-px" as const,
    shapeId: input.descriptor.id,
    semanticEntityId: input.semanticEntityId,
    rect: Object.freeze({ ...rect }),
    baselineY,
    effectiveOpacity
  });
}

function measureVisibleRect(
  input: {
    readonly stage: HTMLElement;
    readonly element: HTMLElement;
    readonly descriptor: KpNativeKatexConformanceShapeDescriptor;
  },
  port: KpNativeKatexConformancePaintMeasurementPort
): KpStageRelativeRect {
  if (input.descriptor.paintClass === "atomic-text") {
    return port.measureTextInkRect(input.stage, input.element);
  }
  if (
    input.descriptor.paintClass === "rule" ||
    input.descriptor.paintClass === "subtree"
  ) {
    const rect = port.measureSubtreePaintRect(input.stage, input.element);
    if (rect === undefined) {
      throw new Error(`${input.descriptor.id} has no realized subtree paint.`);
    }
    return rect;
  }
  throw new Error(
    `${input.descriptor.id} vector paint is outside Native KaTeX conformance.`
  );
}

function measureEffectiveOpacity(
  stage: HTMLElement,
  element: HTMLElement
): number {
  let opacity = 1;
  let current: HTMLElement | null = element;
  while (current !== null) {
    opacity *= Number(getComputedStyle(current).opacity);
    if (current === stage) return opacity;
    current = current.parentElement;
  }
  throw new Error("Visible-ink element must be owned by the observed stage.");
}

function requireFiniteRect(rect: KpStageRelativeRect): void {
  if (
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width < 0 ||
    rect.height < 0
  ) {
    throw new Error("Visible-ink rectangle must be finite and nonnegative.");
  }
}
