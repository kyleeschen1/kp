import {
  projectKpEconomicsStageComposition,
  type KpEconomicsStageCompositionProjection
} from "./economics-demand-shift-stage-composition.ts";
import {
  projectKpEconomicsVerificationReveal,
  type KpEconomicsVerificationRevealProjection
} from "./economics-demand-shift-verification.ts";
import {
  projectKpTutorialCumulativeMotion,
  type KpTutorialMotionBlock,
  type KpTutorialMotionCheckpoint,
  type KpTutorialMotionCorridor,
  type KpTutorialMotionCorridorKeyframe
} from "../kp-tutorial-motion.ts";

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

export interface KpEconomicsMotionCheckpoint
  extends KpTutorialMotionCheckpoint<KpEconomicsMotionCheckpointId> {
  readonly description: string;
}

export interface KpEconomicsMotionCorridorKeyframe
  extends KpTutorialMotionCorridorKeyframe {}

export interface KpEconomicsMotionCorridor extends KpTutorialMotionCorridor {
  readonly keyframes: readonly KpEconomicsMotionCorridorKeyframe[];
}

export interface KpEconomicsMotionBlock
  extends KpTutorialMotionBlock<
    KpEconomicsMotionBlockId,
    KpEconomicsMotionCheckpointId
  > {
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

export interface KpEconomicsLessonPlayheadProjection {
  readonly activeBlockId: KpEconomicsMotionBlockId;
  readonly direction: "forward" | "rewind";
  readonly playerProgress: number;
  readonly localProgress: number;
  readonly graphProgress: number;
  readonly motion: KpEconomicsLessonMotionProjection;
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
        checkpoint(
          "shift-ready",
          "Before the shift",
          0,
          "Supply and demand meet at quantity six hundred boxes and price eight dollars."
        ),
        checkpoint(
          "shift-handoff",
          "Equilibrium handoff",
          0.72,
          "Demand is moving right while the supply curve remains fixed."
        ),
        checkpoint(
          "shift-settled",
          "New equilibrium",
          1,
          "Supply and demand now meet at quantity eight hundred boxes and price ten dollars."
        )
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
        checkpoint(
          "movement-ready",
          "Hold supply fixed",
          0,
          "The market begins at the new equilibrium while the supply curve remains unchanged."
        ),
        checkpoint(
          "movement-traced",
          "Trace movement along supply",
          0.58,
          "The equilibrium point moves upward and rightward along the unchanged supply curve."
        ),
        checkpoint(
          "movement-verified",
          "Compare price and quantity",
          1,
          "Price and quantity are both higher even though the supply curve did not shift."
        )
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
  const blocks = projectKpTutorialCumulativeMotion({
    blocks: kpEconomicsMotionBlocks,
    activeBlockId: input.activeBlockId,
    localProgress: input.localProgress
  });
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

export function projectKpEconomicsLessonPlayhead(input: {
  readonly activeBlockId: KpEconomicsMotionBlockId;
  readonly direction: "forward" | "rewind";
  readonly playerProgress: number;
}): KpEconomicsLessonPlayheadProjection {
  const playerProgress = boundedProgress(input.playerProgress);
  // The shared player stores progress in traversal space. Lesson state stays
  // forward-oriented so a direction change cannot invert cumulative blocks.
  const localProgress = input.direction === "rewind"
    ? 1 - playerProgress
    : playerProgress;
  const motion = projectKpEconomicsLessonMotion({
    activeBlockId: input.activeBlockId,
    localProgress
  });
  return Object.freeze({
    activeBlockId: input.activeBlockId,
    direction: input.direction,
    playerProgress,
    localProgress,
    graphProgress: motion.demandShiftProgress,
    motion
  });
}

export function projectKpEconomicsPlayerProgress(input: {
  readonly direction: "forward" | "rewind";
  readonly localProgress: number;
}): number {
  const localProgress = boundedProgress(input.localProgress);
  return input.direction === "rewind" ? 1 - localProgress : localProgress;
}

export function localKpEconomicsMotionProgress(
  projection: KpEconomicsLessonMotionProjection
): number {
  return projection.blocks.find(({ id }) => id === projection.activeBlockId)
    ?.progress ?? 0;
}

function boundedProgress(progress: number): number {
  return Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
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
  progress: number,
  description: string
): KpEconomicsMotionCheckpoint {
  return Object.freeze({ id, label, progress, description });
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
