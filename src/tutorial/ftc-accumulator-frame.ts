import {
  getKpFtcFunctionLens,
  sampleKpFtcFunctionLens,
  type KpFtcFunctionLensId
} from "./ftc-function-lens.ts";

export type KpFtcGraphPoint = readonly [x: number, y: number];

export interface KpFtcAccumulatorFrame {
  readonly id: string;
  readonly kind: "ftc-accumulator-frame";
  readonly lensId: KpFtcFunctionLensId;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
  readonly upperBound: number;
  readonly integrandAtUpperBound: number;
  readonly accumulatedArea: number;
  readonly curvePoints: readonly KpFtcGraphPoint[];
  readonly areaPolygon: readonly KpFtcGraphPoint[];
  readonly upperBoundSegment: readonly [KpFtcGraphPoint, KpFtcGraphPoint];
  readonly persistentSelectorIds: readonly string[];
}

export function sampleKpFtcAccumulatorFrame(input: {
  readonly lensId: KpFtcFunctionLensId;
  readonly upperBound: number;
  readonly sampleCount?: number | undefined;
}): KpFtcAccumulatorFrame {
  const lens = getKpFtcFunctionLens(input.lensId);
  const sampleCount = Math.max(12, Math.floor(input.sampleCount ?? 81));
  const upper = sampleKpFtcFunctionLens(input.lensId, input.upperBound);
  const curvePoints = sampleRange(
    lens.domain[0],
    lens.domain[1],
    sampleCount,
    (t) => sampleKpFtcFunctionLens(input.lensId, t).integrand
  );
  const areaSampleCount = Math.max(
    2,
    Math.ceil(sampleCount * ((upper.t - lens.domain[0]) / domainLength(lens.domain)))
  );
  const areaCurve = sampleRange(
    lens.domain[0],
    upper.t,
    areaSampleCount,
    (t) => sampleKpFtcFunctionLens(input.lensId, t).integrand
  );
  const yMaximum = Math.max(1, ...curvePoints.map(([, y]) => y)) * 1.12;

  return {
    id: `frame.ftc.accumulator.${input.lensId}.${upper.t}`,
    kind: "ftc-accumulator-frame",
    lensId: input.lensId,
    xDomain: lens.domain,
    yDomain: [0, yMaximum],
    upperBound: upper.t,
    integrandAtUpperBound: upper.integrand,
    accumulatedArea: upper.accumulatedArea,
    curvePoints,
    areaPolygon: [
      [lens.domain[0], 0],
      ...areaCurve,
      [upper.t, 0]
    ],
    upperBoundSegment: [
      [upper.t, 0],
      [upper.t, upper.integrand]
    ],
    persistentSelectorIds: [
      "ftc.graph.axes",
      "ftc.graph.integrand-curve",
      "ftc.graph.lower-bound",
      "ftc.graph.accumulated-area",
      "ftc.graph.upper-bound"
    ]
  };
}

function sampleRange(
  start: number,
  end: number,
  count: number,
  evaluate: (x: number) => number
): readonly KpFtcGraphPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const x = start + (end - start) * (index / (count - 1));
    return [x, evaluate(x)] as const;
  });
}

function domainLength(domain: readonly [number, number]): number {
  return domain[1] - domain[0];
}
