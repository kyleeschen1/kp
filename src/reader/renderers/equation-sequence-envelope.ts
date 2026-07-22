export interface KpEquationSequenceStateMeasurement {
  readonly stateId: string;
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface KpEquationSequenceStatePlacement {
  readonly stateId: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly offsetXPx: number;
  readonly offsetYPx: number;
}

export interface KpEquationSequenceEnvelopePlan {
  readonly kind: "equation-sequence-envelope-plan";
  readonly baseFontSizePx: number;
  readonly fontSizePx: number;
  readonly scale: number;
  readonly widestStateId: string;
  readonly tallestStateId: string;
  readonly contentWidthPx: number;
  readonly contentHeightPx: number;
  readonly reservedWidthPx: number;
  readonly reservedHeightPx: number;
  readonly availableWidthPx: number;
  readonly wrapAllowed: false;
  readonly geometryPolicy: "measure-once-per-sequence";
  readonly status: "native" | "scaled" | "overflow";
  readonly placements: readonly KpEquationSequenceStatePlacement[];
}

/**
 * Reserves one centered envelope for a complete equation sequence. This keeps
 * changes in fraction depth from resizing or recentering the surrounding card.
 */
export function planKpEquationSequenceEnvelope(input: {
  readonly measurements: readonly KpEquationSequenceStateMeasurement[];
  readonly viewportWidthPx: number;
  readonly horizontalPaddingPx?: number;
  readonly verticalPaddingPx?: number;
  readonly baseFontSizePx?: number;
  readonly minScale?: number;
}): KpEquationSequenceEnvelopePlan {
  if (input.measurements.length === 0) {
    throw new Error("Equation sequence planning requires measured states.");
  }
  const horizontalPaddingPx = input.horizontalPaddingPx ?? 24;
  const verticalPaddingPx = input.verticalPaddingPx ?? 12;
  const baseFontSizePx = input.baseFontSizePx ?? 23.232;
  const minScale = input.minScale ?? 0.72;
  const numericValues = [
    input.viewportWidthPx,
    horizontalPaddingPx,
    verticalPaddingPx,
    baseFontSizePx,
    minScale,
    ...input.measurements.flatMap(({ widthPx, heightPx }) => [widthPx, heightPx])
  ];
  if (
    !numericValues.every(Number.isFinite) ||
    input.viewportWidthPx <= horizontalPaddingPx * 2 ||
    horizontalPaddingPx < 0 ||
    verticalPaddingPx < 0 ||
    baseFontSizePx <= 0 ||
    minScale <= 0 ||
    minScale > 1 ||
    input.measurements.some(({ stateId, widthPx, heightPx }) =>
      stateId.trim().length === 0 || widthPx <= 0 || heightPx <= 0
    )
  ) {
    throw new Error(
      "Equation sequence planning requires named states, finite positive geometry, and a scale within (0, 1]."
    );
  }

  const widest = input.measurements.reduce((left, right) =>
    right.widthPx > left.widthPx ? right : left
  );
  const tallest = input.measurements.reduce((left, right) =>
    right.heightPx > left.heightPx ? right : left
  );
  const availableWidthPx = input.viewportWidthPx - horizontalPaddingPx * 2;
  const requiredScale = Math.min(1, availableWidthPx / widest.widthPx);
  const status = requiredScale >= 1
    ? "native"
    : requiredScale >= minScale
      ? "scaled"
      : "overflow";
  const scale = status === "overflow" ? minScale : requiredScale;
  const contentWidthPx = widest.widthPx * scale;
  const contentHeightPx = tallest.heightPx * scale;

  return {
    kind: "equation-sequence-envelope-plan",
    baseFontSizePx,
    fontSizePx: baseFontSizePx * scale,
    scale,
    widestStateId: widest.stateId,
    tallestStateId: tallest.stateId,
    contentWidthPx,
    contentHeightPx,
    reservedWidthPx: contentWidthPx + horizontalPaddingPx * 2,
    reservedHeightPx: contentHeightPx + verticalPaddingPx * 2,
    availableWidthPx,
    wrapAllowed: false,
    geometryPolicy: "measure-once-per-sequence",
    status,
    placements: input.measurements.map((measurement) => {
      const widthPx = measurement.widthPx * scale;
      const heightPx = measurement.heightPx * scale;
      return {
        stateId: measurement.stateId,
        widthPx,
        heightPx,
        offsetXPx: (contentWidthPx - widthPx) / 2,
        offsetYPx: (contentHeightPx - heightPx) / 2
      };
    })
  };
}
