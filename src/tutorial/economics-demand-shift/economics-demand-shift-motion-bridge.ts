import type {
  KpTutorialMotionBridgeAuthoring
} from "../kp-tutorial-motion-bridge-authoring.ts";
import type {
  KpTutorialMotionCorridor
} from "../kp-tutorial-motion.ts";
import {
  findKpEconomicsMotionBlock,
  findKpEconomicsMotionCheckpoint
} from "./economics-demand-shift-motion-blocks.ts";

/**
 * Adapts an authored semantic interval to the existing lesson scroll clock.
 * The host supplies cached pixels; this projection never measures the DOM.
 */
export function projectKpEconomicsMotionBridgeCorridor(input: {
  readonly bridge: KpTutorialMotionBridgeAuthoring;
  readonly viewportHeightPx: number;
  readonly readingAnchorPx: number;
  readonly distancePx: number;
}): KpTutorialMotionCorridor {
  const viewportHeight = positive(input.viewportHeightPx, "viewport height");
  const distance = positive(input.distancePx, "motion bridge distance");
  const readingAnchor = finite(input.readingAnchorPx, "reading anchor");
  const block = findKpEconomicsMotionBlock(input.bridge.motionBlockId);
  if (block === undefined) {
    throw new Error(
      `Unknown economics motion bridge block: ${input.bridge.motionBlockId}`
    );
  }
  const from = findKpEconomicsMotionCheckpoint({
    blockId: block.id,
    checkpointId: input.bridge.fromCheckpointId
  });
  const to = findKpEconomicsMotionCheckpoint({
    blockId: block.id,
    checkpointId: input.bridge.toCheckpointId
  });
  if (from === undefined || to === undefined || to.progress <= from.progress) {
    throw new Error("Economics motion bridge checkpoints must be ordered.");
  }
  return Object.freeze({
    startViewportRatio: readingAnchor / viewportHeight,
    endViewportRatio: (readingAnchor - distance) / viewportHeight,
    keyframes: Object.freeze([
      Object.freeze({ travel: 0, progress: from.progress }),
      Object.freeze({ travel: 1, progress: to.progress })
    ])
  });
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Economics motion bridge ${label} must be finite.`);
  }
  return value;
}

function positive(value: number, label: string): number {
  const result = finite(value, label);
  if (result <= 0) {
    throw new Error(`Economics motion bridge ${label} must be positive.`);
  }
  return result;
}
