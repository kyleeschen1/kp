import {
  createKpReaderClockSample,
  type KpReaderClockListener,
  type KpReaderClockSample,
  type KpReaderPlaybackClock
} from "./playback-clock.ts";

export interface KpReaderScrollGeometry {
  readonly startPx: number;
  readonly endPx: number;
}

export interface KpReaderScrollCheckpoint {
  readonly id: string;
  readonly progressPermille: number;
}

export interface KpReaderContinuousScrollClock extends KpReaderPlaybackClock {
  readonly source: "scroll";
  samplePosition(positionPx: number): KpReaderClockSample;
  updateGeometry(geometry: KpReaderScrollGeometry): void;
}

export function createKpReaderContinuousScrollClock(input: {
  readonly id: string;
  readonly geometry: KpReaderScrollGeometry;
  readonly initialPositionPx?: number | undefined;
  readonly checkpoints?: readonly KpReaderScrollCheckpoint[] | undefined;
}): KpReaderContinuousScrollClock {
  if (input.id.trim() === "") throw new Error("continuous scroll clock id must not be empty");
  let geometry = validateGeometry(input.geometry);
  const checkpoints = validateCheckpoints(input.checkpoints ?? []);
  const listeners = new Set<KpReaderClockListener>();
  let disposed = false;
  let sequence = 0;
  const initialProgress = progressAt(input.initialPositionPx ?? geometry.startPx, geometry);
  let snapshot = createKpReaderClockSample({
    source: "scroll",
    progress: initialProgress,
    sequence,
    checkpointId: checkpointAt(initialProgress, checkpoints)
  });
  const requireActive = (): void => {
    if (disposed) throw new Error(`continuous scroll clock ${input.id} is disposed`);
  };

  return {
    id: input.id,
    source: "scroll",
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      requireActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    samplePosition(positionPx) {
      requireActive();
      const progress = progressAt(positionPx, geometry);
      sequence += 1;
      snapshot = createKpReaderClockSample({
        source: "scroll",
        progress,
        previousProgress: snapshot.progress,
        sequence,
        checkpointId: checkpointAt(progress, checkpoints)
      });
      listeners.forEach((listener) => listener(snapshot));
      return snapshot;
    },
    updateGeometry(nextGeometry) {
      requireActive();
      geometry = validateGeometry(nextGeometry);
    },
    dispose() {
      disposed = true;
      listeners.clear();
    }
  };
}

export function sampleKpReaderScrollProgress(
  positionPx: number,
  geometry: KpReaderScrollGeometry
): number {
  return progressAt(positionPx, validateGeometry(geometry));
}

function progressAt(positionPx: number, geometry: KpReaderScrollGeometry): number {
  if (!Number.isFinite(positionPx)) throw new Error("scroll position must be finite");
  return Math.min(1, Math.max(0,
    (positionPx - geometry.startPx) / (geometry.endPx - geometry.startPx)
  ));
}

function validateGeometry(geometry: KpReaderScrollGeometry): KpReaderScrollGeometry {
  if (!Number.isFinite(geometry.startPx) || !Number.isFinite(geometry.endPx)) {
    throw new Error("scroll geometry must be finite");
  }
  if (geometry.endPx <= geometry.startPx) {
    throw new Error("scroll geometry end must follow start");
  }
  return { ...geometry };
}

function validateCheckpoints(
  checkpoints: readonly KpReaderScrollCheckpoint[]
): readonly KpReaderScrollCheckpoint[] {
  let previous = -1;
  return checkpoints.map((checkpoint) => {
    if (checkpoint.id.trim() === "") throw new Error("scroll checkpoint id must not be empty");
    if (!Number.isInteger(checkpoint.progressPermille)
      || checkpoint.progressPermille < 0
      || checkpoint.progressPermille > 1_000
      || checkpoint.progressPermille < previous) {
      throw new Error("scroll checkpoints must be ordered integers from 0 through 1000");
    }
    previous = checkpoint.progressPermille;
    return { ...checkpoint };
  });
}

function checkpointAt(
  progress: number,
  checkpoints: readonly KpReaderScrollCheckpoint[]
): string | undefined {
  const progressPermille = Math.round(progress * 1_000);
  for (let index = checkpoints.length - 1; index >= 0; index -= 1) {
    const checkpoint = checkpoints[index]!;
    if (checkpoint.progressPermille <= progressPermille) return checkpoint.id;
  }
  return undefined;
}
