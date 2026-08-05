import type {
  KpTutorialMotionBridgeAuthoring
} from "../kp-tutorial-motion-bridge-authoring.ts";
import type {
  KpTutorialMotionCorridor
} from "../kp-tutorial-motion.ts";
import type {
  KpEconomicsMotionBridgeDwellProfile
} from "./economics-demand-shift-layout.ts";
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
  readonly dwellProfile?: KpEconomicsMotionBridgeDwellProfile | undefined;
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
    keyframes: projectDwellKeyframes({
      corridor: block.corridor,
      fromProgress: from.progress,
      toProgress: to.progress,
      profile: input.dwellProfile ?? "none"
    })
  });
}

const dwellShareByProfile = Object.freeze({
  preserve: 0.15,
  medium: 0.2,
  recommended: 0.25
} satisfies Readonly<Record<
  Exclude<KpEconomicsMotionBridgeDwellProfile, "none">,
  number
>>);

function projectDwellKeyframes(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly fromProgress: number;
  readonly toProgress: number;
  readonly profile: KpEconomicsMotionBridgeDwellProfile;
}): KpTutorialMotionCorridor["keyframes"] {
  const linear = () => Object.freeze([
    Object.freeze({ travel: 0, progress: input.fromProgress }),
    Object.freeze({ travel: 1, progress: input.toProgress })
  ]);
  if (input.profile === "none") return linear();

  const source = input.corridor.keyframes;
  const departure = [...source].reverse().find(({ progress }) =>
    progress === input.fromProgress
  );
  const arrival = source.find(({ progress }) => progress === input.toProgress);
  if (departure === undefined || arrival === undefined ||
      arrival.travel <= departure.travel) {
    return linear();
  }
  const plateau = source.slice(1).map((after, index) => ({
    before: source[index]!,
    after
  })).find(({ before, after }) =>
    before.progress === after.progress &&
      before.progress > input.fromProgress &&
      before.progress < input.toProgress
  );
  if (plateau === undefined) return linear();

  const authoredTravel = arrival.travel - departure.travel;
  const plateauStart = roundUnit(
    (plateau.before.travel - departure.travel) / authoredTravel
  );
  const plateauEnd = Math.min(
    1,
    plateauStart + dwellShareByProfile[input.profile]
  );
  // This economics-only profile changes time spent reading the handoff state;
  // the semantic state itself remains the authored checkpoint at every sample.
  return Object.freeze([
    Object.freeze({ travel: 0, progress: input.fromProgress }),
    Object.freeze({ travel: plateauStart, progress: plateau.before.progress }),
    Object.freeze({ travel: plateauEnd, progress: plateau.after.progress }),
    Object.freeze({ travel: 1, progress: input.toProgress })
  ]);
}

function roundUnit(value: number): number {
  return Math.round(value * 10_000) / 10_000;
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
