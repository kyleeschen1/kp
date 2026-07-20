import type { KpReaderClockSample } from "./playback-clock.ts";
import type { KpReaderMotionPolicy } from "./motion-policy.ts";

export interface KpReaderAccessibleCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly progressPermille: number;
}

export interface KpReaderMotionProjection {
  readonly mode: "continuous" | "essential" | "checkpoint";
  readonly progress: number;
  readonly progressPermille: number;
  readonly checkpointId: string;
  readonly checkpointLabel: string;
}

export interface KpReaderControlModel {
  readonly groupLabel: string;
  readonly slider: {
    readonly label: string;
    readonly min: 0;
    readonly max: 1_000;
    readonly step: 1;
    readonly value: number;
    readonly valueText: string;
  };
  readonly previous: {
    readonly label: string;
    readonly disabled: boolean;
    readonly targetProgressPermille?: number | undefined;
  };
  readonly next: {
    readonly label: string;
    readonly disabled: boolean;
    readonly targetProgressPermille?: number | undefined;
  };
}

export function projectKpReaderMotion(input: {
  readonly clock: KpReaderClockSample;
  readonly checkpoints: readonly KpReaderAccessibleCheckpoint[];
  readonly policy: KpReaderMotionPolicy;
}): KpReaderMotionProjection {
  const checkpoints = validate(input.checkpoints);
  const checkpointSampling = input.policy.sampling === "checkpoint";
  const index = checkpointSampling
    ? nearestIndex(input.clock.progressPermille, input.clock.direction, checkpoints)
    : activeIndex(input.clock.progressPermille, checkpoints);
  const checkpoint = checkpoints[index]!;
  return {
    mode: checkpointSampling
      ? "checkpoint"
      : input.policy.resolvedMode === "essential"
        ? "essential"
        : "continuous",
    progress: checkpointSampling
      ? checkpoint.progressPermille / 1_000
      : input.clock.progress,
    progressPermille: checkpointSampling
      ? checkpoint.progressPermille
      : input.clock.progressPermille,
    checkpointId: checkpoint.id,
    checkpointLabel: checkpoint.label
  };
}

export function createKpReaderControlModel(input: {
  readonly projection: KpReaderMotionProjection;
  readonly checkpoints: readonly KpReaderAccessibleCheckpoint[];
}): KpReaderControlModel {
  const checkpoints = validate(input.checkpoints);
  const current = activeIndex(input.projection.progressPermille, checkpoints);
  const previous = checkpoints[current - 1];
  const next = checkpoints[current + 1];
  return {
    groupLabel: "Animation controls",
    slider: {
      label: "Explanation progress",
      min: 0,
      max: 1_000,
      step: 1,
      value: input.projection.progressPermille,
      valueText: `${input.projection.checkpointLabel}, ${Math.round(input.projection.progress * 100)} percent`
    },
    previous: {
      label: previous === undefined ? "Previous step" : `Previous: ${previous.label}`,
      disabled: previous === undefined,
      ...(previous === undefined ? {} : { targetProgressPermille: previous.progressPermille })
    },
    next: {
      label: next === undefined ? "Next step" : `Next: ${next.label}`,
      disabled: next === undefined,
      ...(next === undefined ? {} : { targetProgressPermille: next.progressPermille })
    }
  };
}

function validate(
  checkpoints: readonly KpReaderAccessibleCheckpoint[]
): readonly KpReaderAccessibleCheckpoint[] {
  if (checkpoints.length === 0) throw new Error("reader controls require checkpoints");
  let previous = -1;
  for (const checkpoint of checkpoints) {
    if (checkpoint.id.trim() === "" || checkpoint.label.trim() === "") {
      throw new Error("reader control checkpoint identity and label must not be empty");
    }
    if (!Number.isInteger(checkpoint.progressPermille)
      || checkpoint.progressPermille < previous
      || checkpoint.progressPermille < 0
      || checkpoint.progressPermille > 1_000) {
      throw new Error("reader control checkpoints must be ordered integers from 0 through 1000");
    }
    previous = checkpoint.progressPermille;
  }
  return checkpoints;
}

function activeIndex(
  progressPermille: number,
  checkpoints: readonly KpReaderAccessibleCheckpoint[]
): number {
  let result = 0;
  checkpoints.forEach((checkpoint, index) => {
    if (checkpoint.progressPermille <= progressPermille) result = index;
  });
  return result;
}

function nearestIndex(
  progressPermille: number,
  direction: KpReaderClockSample["direction"],
  checkpoints: readonly KpReaderAccessibleCheckpoint[]
): number {
  let result = 0;
  let distance = Number.POSITIVE_INFINITY;
  checkpoints.forEach((checkpoint, index) => {
    const candidate = Math.abs(checkpoint.progressPermille - progressPermille);
    if (candidate < distance || (candidate === distance
      && (direction === "forward" ? index > result : index < result))) {
      result = index;
      distance = candidate;
    }
  });
  return result;
}
