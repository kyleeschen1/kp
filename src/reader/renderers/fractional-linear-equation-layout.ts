export interface KpFractionalLinearStateMeasurement {
  readonly stateId: string;
  readonly widthPx: number;
  readonly heightPx: number;
}

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
  if (input.measurements.length === 0) throw new Error("Typography planning requires measured states.");
  const horizontalPaddingPx = input.horizontalPaddingPx ?? 24;
  const baseFontSizePx = input.baseFontSizePx ?? 23.232;
  const minScale = input.minScale ?? 0.72;
  const values = [input.viewportWidthPx, horizontalPaddingPx, baseFontSizePx, minScale,
    ...input.measurements.flatMap(({ widthPx, heightPx }) => [widthPx, heightPx])];
  if (!values.every(Number.isFinite) || input.viewportWidthPx <= horizontalPaddingPx * 2 ||
    baseFontSizePx <= 0 || minScale <= 0 || minScale > 1 ||
    input.measurements.some(({ widthPx, heightPx }) => widthPx <= 0 || heightPx <= 0)) {
    throw new Error("Typography planning requires finite positive geometry and a scale within (0, 1].");
  }
  const widest = input.measurements.reduce((left, right) =>
    right.widthPx > left.widthPx ? right : left
  );
  const availableWidthPx = input.viewportWidthPx - horizontalPaddingPx * 2;
  const requiredScale = Math.min(1, availableWidthPx / widest.widthPx);
  const status = requiredScale >= 1 ? "native" : requiredScale >= minScale ? "scaled" : "overflow";
  const scale = status === "overflow" ? minScale : requiredScale;
  return {
    kind: "fractional-linear-typography-plan",
    baseFontSizePx,
    fontSizePx: baseFontSizePx * scale,
    scale,
    widestStateId: widest.stateId,
    widestStateWidthPx: widest.widthPx,
    availableWidthPx,
    wrapAllowed: false,
    status
  };
}
