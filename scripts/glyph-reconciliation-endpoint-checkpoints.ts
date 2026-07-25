export interface KpFractionEndpointCheckpoint {
  readonly id: string;
  readonly fractionProgressPermille: number;
  readonly routeProgressPermille: number;
}

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

