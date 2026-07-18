import {
  sampleKpFtcFiniteStrip,
  type KpFtcFiniteStripFrame
} from "./ftc-finite-strip.ts";
import {
  sampleKpFtcFunctionLens,
  type KpFtcFunctionLensId
} from "./ftc-function-lens.ts";

export const kpFtcGuidedDeltaXLevels = [0.75, 0.5, 0.25, 0.125] as const;

export interface KpFtcConvergenceFrame {
  readonly id: string;
  readonly levelIndex: number;
  readonly levelCount: number;
  readonly strip: KpFtcFiniteStripFrame;
  readonly finiteDifferenceQuotient: number;
  readonly limitingIntegrandValue: number;
  readonly quotientError: number;
  readonly boundWidth: number;
  readonly epistemicStatus: "finite-approximation";
  readonly exactDerivativeClaimed: false;
}

export function createKpFtcConvergenceSequence(input: {
  readonly lensId: KpFtcFunctionLensId;
  readonly x: number;
  readonly deltaXLevels?: readonly number[] | undefined;
}): readonly KpFtcConvergenceFrame[] {
  const deltaXLevels = input.deltaXLevels ?? kpFtcGuidedDeltaXLevels;
  if (
    deltaXLevels.length === 0 ||
    deltaXLevels.some((value, index) =>
      !Number.isFinite(value) ||
      value <= 0 ||
      (index > 0 && value >= deltaXLevels[index - 1]!)
    )
  ) {
    throw new Error("Guided delta x levels must be positive and strictly decreasing.");
  }
  const limitingIntegrandValue = sampleKpFtcFunctionLens(
    input.lensId,
    input.x
  ).integrand;

  return deltaXLevels.map((deltaX, levelIndex) => {
    const strip = sampleKpFtcFiniteStrip({
      lensId: input.lensId,
      x: input.x,
      deltaX
    });
    const finiteDifferenceQuotient = strip.exactAreaChange / strip.deltaX;
    return {
      id: `frame.ftc.convergence.${input.lensId}.${levelIndex}`,
      levelIndex,
      levelCount: deltaXLevels.length,
      strip,
      finiteDifferenceQuotient,
      limitingIntegrandValue,
      quotientError: Math.abs(
        finiteDifferenceQuotient - limitingIntegrandValue
      ),
      boundWidth: strip.quotientUpperBound - strip.quotientLowerBound,
      epistemicStatus: "finite-approximation",
      exactDerivativeClaimed: false
    };
  });
}

export function sampleKpFtcConvergenceLevel(input: {
  readonly lensId: KpFtcFunctionLensId;
  readonly x: number;
  readonly levelIndex: number;
}): KpFtcConvergenceFrame {
  const sequence = createKpFtcConvergenceSequence(input);
  const index = Math.min(
    sequence.length - 1,
    Math.max(0, Math.floor(input.levelIndex))
  );
  return sequence[index]!;
}
