import {
  planKpEquationSequenceEnvelope,
  type KpEquationSequenceStateMeasurement
} from "./equation-sequence-envelope.ts";

export interface KpFractionalLinearStateMeasurement
  extends KpEquationSequenceStateMeasurement {}

export interface KpFractionalLinearTypographyPlan {
  readonly kind: "fractional-linear-typography-plan";
  readonly baseFontSizePx: number;
  readonly fontSizePx: number;
  readonly scale: number;
  readonly widestStateId: string;
  readonly widestStateWidthPx: number;
  readonly availableWidthPx: number;
  readonly wrapAllowed: false;
  readonly status: "native" | "scaled" | "overflow";
}

/**
 * Typography is selected from the whole sequence so no state can trigger a
 * mid-animation font change. Geometry may translate, but glyph metrics stay fixed.
 */
export function planKpFractionalLinearTypography(input: {
  readonly measurements: readonly KpFractionalLinearStateMeasurement[];
  readonly viewportWidthPx: number;
  readonly horizontalPaddingPx?: number;
  readonly baseFontSizePx?: number;
  readonly minScale?: number;
}): KpFractionalLinearTypographyPlan {
  const envelope = planKpEquationSequenceEnvelope({
    measurements: input.measurements,
    viewportWidthPx: input.viewportWidthPx,
    ...(input.horizontalPaddingPx === undefined
      ? {}
      : { horizontalPaddingPx: input.horizontalPaddingPx }),
    ...(input.baseFontSizePx === undefined
      ? {}
      : { baseFontSizePx: input.baseFontSizePx }),
    ...(input.minScale === undefined ? {} : { minScale: input.minScale })
  });
  return {
    kind: "fractional-linear-typography-plan",
    baseFontSizePx: envelope.baseFontSizePx,
    fontSizePx: envelope.fontSizePx,
    scale: envelope.scale,
    widestStateId: envelope.widestStateId,
    widestStateWidthPx: envelope.contentWidthPx / envelope.scale,
    availableWidthPx: envelope.availableWidthPx,
    wrapAllowed: false,
    status: envelope.status
  };
}
