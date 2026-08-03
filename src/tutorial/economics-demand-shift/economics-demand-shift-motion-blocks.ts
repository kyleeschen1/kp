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

export type KpEconomicsSemanticMarketState = "initial" | "shifted";

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

export interface KpEconomicsMotionBlock {
  readonly id: KpEconomicsMotionBlockId;
  readonly passageId: "follow-shift" | "shift-versus-movement";
  readonly label: string;
  readonly entry: KpEconomicsMotionSceneState;
  readonly settled: KpEconomicsMotionSceneState;
  readonly checkpoints: readonly KpEconomicsMotionCheckpoint[];
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
      ]
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
      ]
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
    checkpoints: Object.freeze([...block.checkpoints])
  });
}

