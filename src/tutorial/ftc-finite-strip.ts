import type { KpFtcGraphPoint } from "./ftc-accumulator-frame.ts";
import {
  getKpFtcFunctionLens,
  rangeKpFtcFunctionLens,
  sampleKpFtcFunctionLens,
  type KpFtcFunctionLensId
} from "./ftc-function-lens.ts";

export interface KpFtcFiniteStripFrame {
  readonly id: string;
  readonly lensId: KpFtcFunctionLensId;
  readonly x: number;
  readonly deltaX: number;
  readonly nextX: number;
  readonly exactAreaChange: number;
  readonly lowerHeight: number;
  readonly upperHeight: number;
  readonly lowerAreaBound: number;
  readonly upperAreaBound: number;
  readonly quotientLowerBound: number;
  readonly quotientUpperBound: number;
  readonly stripPolygon: readonly KpFtcGraphPoint[];
  readonly lowerRectangle: readonly KpFtcGraphPoint[];
  readonly upperRectangle: readonly KpFtcGraphPoint[];
  readonly selectorIds: readonly string[];
}

export function sampleKpFtcFiniteStrip(input: {
  readonly lensId: KpFtcFunctionLensId;
  readonly x: number;
  readonly deltaX: number;
  readonly sampleCount?: number | undefined;
}): KpFtcFiniteStripFrame {
  if (!Number.isFinite(input.deltaX) || input.deltaX <= 0) {
    throw new Error("FTC finite strip requires a positive delta x.");
  }
  const lens = getKpFtcFunctionLens(input.lensId);
  const x = Math.min(lens.domain[1], Math.max(lens.domain[0], input.x));
  const nextX = Math.min(lens.domain[1], x + input.deltaX);
  const deltaX = nextX - x;
  if (deltaX <= 0) {
    throw new Error("FTC finite strip must fit inside the curated lens domain.");
  }
  const [lowerHeight, upperHeight] = rangeKpFtcFunctionLens(
    input.lensId,
    x,
    nextX
  );
  const atX = sampleKpFtcFunctionLens(input.lensId, x);
  const atNextX = sampleKpFtcFunctionLens(input.lensId, nextX);
  const sampleCount = Math.max(3, Math.floor(input.sampleCount ?? 21));
  const top = Array.from({ length: sampleCount }, (_, index) => {
    const t = x + deltaX * (index / (sampleCount - 1));
    return [t, sampleKpFtcFunctionLens(input.lensId, t).integrand] as const;
  });

  return {
    id: `frame.ftc.strip.${input.lensId}.${x}.${deltaX}`,
    lensId: input.lensId,
    x,
    deltaX,
    nextX,
    exactAreaChange: atNextX.accumulatedArea - atX.accumulatedArea,
    lowerHeight,
    upperHeight,
    lowerAreaBound: lowerHeight * deltaX,
    upperAreaBound: upperHeight * deltaX,
    quotientLowerBound: lowerHeight,
    quotientUpperBound: upperHeight,
    stripPolygon: [[x, 0], ...top, [nextX, 0]],
    lowerRectangle: rectangle(x, nextX, lowerHeight),
    upperRectangle: rectangle(x, nextX, upperHeight),
    selectorIds: [
      "ftc.graph.added-strip",
      "ftc.graph.lower-bound-rectangle",
      "ftc.graph.upper-bound-rectangle",
      "ftc.graph.delta-x"
    ]
  };
}

function rectangle(
  x: number,
  nextX: number,
  height: number
): readonly KpFtcGraphPoint[] {
  return [
    [x, 0],
    [x, height],
    [nextX, height],
    [nextX, 0]
  ];
}
