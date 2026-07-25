export interface KpFractionEndpointCheckpoint {
  readonly id: string;
  readonly fractionProgressPermille: number;
  readonly routeProgressPermille: number;
}

export const kpFractionEndpointRegressionLimits = Object.freeze({
  maximumGlyphRectResidualPx: 0.25,
  maximumGlyphBaselineResidualPx: 2.5,
  maximumRuleGeometryResidualPx: 0.25
});

const fractionWindow = {
  start: 0.14,
  span: 0.72
} as const;

const fractionEndpointProgress = [
  960,
  970,
  980,
  990,
  995,
  999,
  1_000
] as const;

export const kpFractionEndpointCheckpoints: readonly KpFractionEndpointCheckpoint[] =
  fractionEndpointProgress.map((fractionProgressPermille) => ({
    id: fractionProgressPermille === 1_000
      ? "native-target"
      : `material-${fractionProgressPermille}`,
    fractionProgressPermille,
    routeProgressPermille: Math.round(
      (fractionWindow.start +
        fractionWindow.span * fractionProgressPermille / 1_000) *
        1_000
    )
  }));
