export type KpEconomicsStageSurfaceId =
  | "market-graph"
  | "equilibrium-verification";

export type KpEconomicsStageSlotId =
  | "graph-slot"
  | "verification-slot";

export interface KpEconomicsNormalizedRect {
  readonly inline: number;
  readonly block: number;
  readonly inlineSize: number;
  readonly blockSize: number;
}

export interface KpEconomicsStageSlotProjection {
  readonly id: KpEconomicsStageSlotId;
  readonly rect: KpEconomicsNormalizedRect;
}

export interface KpEconomicsStageSurfaceProjection {
  readonly id: KpEconomicsStageSurfaceId;
  readonly slotId: KpEconomicsStageSlotId;
  readonly lifecycle: "outside" | "present" | "transiting" | "settled";
  readonly rect: KpEconomicsNormalizedRect;
}

export interface KpEconomicsStageApertureProjection {
  readonly id: "verification-aperture";
  readonly edge: "inline-end";
  readonly openness: number;
  readonly rect: KpEconomicsNormalizedRect;
}

export interface KpEconomicsStageCompositionProjection {
  readonly phase: "merged" | "composing" | "split";
  readonly progress: number;
  readonly stage: {
    readonly id: "economics-stage";
    readonly rect: KpEconomicsNormalizedRect;
  };
  readonly slots: readonly KpEconomicsStageSlotProjection[];
  readonly aperture: KpEconomicsStageApertureProjection;
  readonly surfaces: readonly KpEconomicsStageSurfaceProjection[];
}

export const kpEconomicsStageCompositionInterval = Object.freeze({
  start: 0.58,
  end: 0.84
});

const stageRect = rect(0, 0, 1, 1);
const graphMergedRect = rect(0, 0, 1, 1);
const graphSplitRect = rect(0.02, 0.03, 0.64, 0.94);
const verificationSlotRect = rect(0.7, 0.14, 0.28, 0.72);

export function projectKpEconomicsStageComposition(
  supplyMovementProgress: number
): KpEconomicsStageCompositionProjection {
  const progress = projectCompositionProgress(supplyMovementProgress);
  const graphRect = interpolateRect(
    graphMergedRect,
    graphSplitRect,
    progress
  );
  const apertureRight = verificationSlotRect.inline +
    verificationSlotRect.inlineSize;
  const apertureRect = rect(
    interpolate(apertureRight, verificationSlotRect.inline, progress),
    verificationSlotRect.block,
    verificationSlotRect.inlineSize * progress,
    verificationSlotRect.blockSize
  );
  const verificationRect = rect(
    interpolate(apertureRight, verificationSlotRect.inline, progress),
    verificationSlotRect.block,
    verificationSlotRect.inlineSize,
    verificationSlotRect.blockSize
  );

  // This remains lesson-local until a second caller proves that these nouns and
  // normalized endpoints describe more than the economics exemplar.
  return Object.freeze({
    phase: progress <= 0 ? "merged" : progress >= 1 ? "split" : "composing",
    progress,
    stage: Object.freeze({ id: "economics-stage", rect: stageRect }),
    slots: Object.freeze([
      Object.freeze({ id: "graph-slot", rect: graphRect }),
      Object.freeze({ id: "verification-slot", rect: verificationSlotRect })
    ]),
    aperture: Object.freeze({
      id: "verification-aperture",
      edge: "inline-end",
      openness: progress,
      rect: apertureRect
    }),
    surfaces: Object.freeze([
      Object.freeze({
        id: "market-graph",
        slotId: "graph-slot",
        lifecycle: "present",
        rect: graphRect
      }),
      Object.freeze({
        id: "equilibrium-verification",
        slotId: "verification-slot",
        lifecycle: progress <= 0
          ? "outside"
          : progress >= 1
            ? "settled"
            : "transiting",
        rect: verificationRect
      })
    ])
  });
}

function projectCompositionProgress(supplyMovementProgress: number): number {
  const safeProgress = Number.isFinite(supplyMovementProgress)
    ? Math.max(0, Math.min(1, supplyMovementProgress))
    : 0;
  const linear = Math.max(0, Math.min(1,
    (safeProgress - kpEconomicsStageCompositionInterval.start) /
      (kpEconomicsStageCompositionInterval.end -
        kpEconomicsStageCompositionInterval.start)
  ));

  return linear * linear * (3 - 2 * linear);
}

function interpolateRect(
  from: KpEconomicsNormalizedRect,
  to: KpEconomicsNormalizedRect,
  progress: number
): KpEconomicsNormalizedRect {
  return rect(
    interpolate(from.inline, to.inline, progress),
    interpolate(from.block, to.block, progress),
    interpolate(from.inlineSize, to.inlineSize, progress),
    interpolate(from.blockSize, to.blockSize, progress)
  );
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function rect(
  inline: number,
  block: number,
  inlineSize: number,
  blockSize: number
): KpEconomicsNormalizedRect {
  return Object.freeze({ inline, block, inlineSize, blockSize });
}
