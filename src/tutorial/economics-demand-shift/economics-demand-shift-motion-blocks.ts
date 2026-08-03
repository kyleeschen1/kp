import {
  projectKpEconomicsStageComposition,
  type KpEconomicsStageCompositionProjection
} from "./economics-demand-shift-stage-composition.ts";
import {
  projectKpEconomicsVerificationReveal,
  type KpEconomicsVerificationRevealProjection
} from "./economics-demand-shift-verification.ts";

export type KpEconomicsMotionBlockId =
  | "demand-shift"
  | "supply-movement";

export type KpEconomicsMotionCheckpointId =
  | "shift-ready"
  | "shift-handoff"
  | "shift-settled"
  | "movement-ready"
  | "movement-traced"
  | "movement-verified";

export type KpEconomicsSemanticMarketState =
  | "initial"
  | "shifting"
  | "shifted";

export type KpEconomicsPresentationState =
  | "graph-only"
  | "supply-trace"
  | "comparison-verified";

export interface KpEconomicsMotionSceneState {
  readonly market: KpEconomicsSemanticMarketState;
  readonly presentation: KpEconomicsPresentationState;
}

export interface KpEconomicsMotionCheckpoint {
  readonly id: KpEconomicsMotionCheckpointId;
  readonly label: string;
  readonly progress: number;
}

export interface KpEconomicsMotionCorridorKeyframe {
  readonly travel: number;
  readonly progress: number;
}

export interface KpEconomicsMotionCorridor {
  readonly startViewportRatio: number;
  readonly endViewportRatio: number;
  readonly keyframes: readonly KpEconomicsMotionCorridorKeyframe[];
}

export interface KpEconomicsMotionBlock {
  readonly id: KpEconomicsMotionBlockId;
  readonly passageId: "follow-shift" | "shift-versus-movement";
  readonly label: string;
  readonly entry: KpEconomicsMotionSceneState;
  readonly settled: KpEconomicsMotionSceneState;
  readonly checkpoints: readonly KpEconomicsMotionCheckpoint[];
  readonly corridor: KpEconomicsMotionCorridor;
}

export interface KpEconomicsMotionBlockProjection {
  readonly id: KpEconomicsMotionBlockId;
  readonly status: "settled" | "active" | "inactive";
  readonly progress: number;
}

export interface KpEconomicsLessonMotionProjection {
  readonly activeBlockId: KpEconomicsMotionBlockId;
  readonly blocks: readonly KpEconomicsMotionBlockProjection[];
  readonly demandShiftProgress: number;
  readonly supplyMovementProgress: number;
  readonly scene: KpEconomicsMotionSceneState;
  readonly composition: KpEconomicsStageCompositionProjection;
  readonly verification: KpEconomicsVerificationRevealProjection;
}

export const kpEconomicsMotionBlocks: readonly KpEconomicsMotionBlock[] =
  Object.freeze([
    motionBlock({
      id: "demand-shift",
      passageId: "follow-shift",
      label: "Demand shifts",
      entry: scene("initial", "graph-only"),
      settled: scene("shifted", "graph-only"),
      checkpoints: [
        checkpoint("shift-ready", "Before the shift", 0),
        checkpoint("shift-handoff", "Equilibrium handoff", 0.72),
        checkpoint("shift-settled", "New equilibrium", 1)
      ],
      corridor: corridor([
        [0, 0],
        [0.14, 0],
        [0.57, 0.72],
        [0.69, 0.72],
        [0.94, 1],
        [1, 1]
      ])
    }),
    motionBlock({
      id: "supply-movement",
      passageId: "shift-versus-movement",
      label: "Supply did not shift",
      entry: scene("shifted", "graph-only"),
      settled: scene("shifted", "comparison-verified"),
      checkpoints: [
        checkpoint("movement-ready", "Hold supply fixed", 0),
        checkpoint("movement-traced", "Trace movement along supply", 0.58),
        checkpoint("movement-verified", "Compare price and quantity", 1)
      ],
      corridor: corridor([
        [0, 0],
        [0.16, 0],
        [0.55, 0.58],
        [0.67, 0.58],
        [0.94, 1],
        [1, 1]
      ])
    })
  ]);

export function findKpEconomicsMotionBlock(
  id: string | undefined
): KpEconomicsMotionBlock | undefined {
  return kpEconomicsMotionBlocks.find((block) => block.id === id);
}

export function findKpEconomicsMotionCheckpoint(input: {
  readonly blockId: KpEconomicsMotionBlockId;
  readonly checkpointId: string | undefined;
}): KpEconomicsMotionCheckpoint | undefined {
  return findKpEconomicsMotionBlock(input.blockId)?.checkpoints.find(
    (checkpoint) => checkpoint.id === input.checkpointId
  );
}

export function projectKpEconomicsLessonMotion(input: {
  readonly activeBlockId: KpEconomicsMotionBlockId;
  readonly localProgress: number;
}): KpEconomicsLessonMotionProjection {
  const activeIndex = kpEconomicsMotionBlocks.findIndex(
    (block) => block.id === input.activeBlockId
  );
  if (activeIndex < 0) {
    throw new Error(`Unknown economics motion block: ${input.activeBlockId}`);
  }
  const localProgress = clampProgress(input.localProgress);
  const blocks = kpEconomicsMotionBlocks.map((block, index) => Object.freeze({
    id: block.id,
    status: index < activeIndex
      ? "settled" as const
      : index === activeIndex
        ? "active" as const
        : "inactive" as const,
    progress: index < activeIndex ? 1 : index === activeIndex ? localProgress : 0
  }));
  const demandShiftProgress = blocks[0]!.progress;
  const supplyMovementProgress = blocks[1]!.progress;

  return Object.freeze({
    activeBlockId: input.activeBlockId,
    blocks: Object.freeze(blocks),
    demandShiftProgress,
    supplyMovementProgress,
    composition: projectKpEconomicsStageComposition(supplyMovementProgress),
    verification: projectKpEconomicsVerificationReveal(
      supplyMovementProgress
    ),
    scene: supplyMovementProgress >= 1
      ? scene("shifted", "comparison-verified")
      : supplyMovementProgress > 0
        ? scene("shifted", "supply-trace")
        : demandShiftProgress >= 1
          ? scene("shifted", "graph-only")
          : demandShiftProgress > 0
            ? scene("shifting", "graph-only")
            : scene("initial", "graph-only")
  });
}

function scene(
  market: KpEconomicsSemanticMarketState,
  presentation: KpEconomicsPresentationState
): KpEconomicsMotionSceneState {
  return Object.freeze({ market, presentation });
}

function checkpoint(
  id: KpEconomicsMotionCheckpointId,
  label: string,
  progress: number
): KpEconomicsMotionCheckpoint {
  return Object.freeze({ id, label, progress });
}

function motionBlock(
  block: KpEconomicsMotionBlock
): KpEconomicsMotionBlock {
  return Object.freeze({
    ...block,
    checkpoints: Object.freeze([...block.checkpoints]),
    corridor: Object.freeze({
      ...block.corridor,
      keyframes: Object.freeze([...block.corridor.keyframes])
    })
  });
}

function corridor(
  keyframes: readonly (readonly [travel: number, progress: number])[]
): KpEconomicsMotionCorridor {
  return Object.freeze({
    // The block anchor crosses the handoff hold at the established 38% reading band.
    startViewportRatio: 0.72,
    endViewportRatio: 0.16,
    keyframes: Object.freeze(keyframes.map(([travel, progress]) =>
      Object.freeze({ travel, progress })
    ))
  });
}

function clampProgress(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
