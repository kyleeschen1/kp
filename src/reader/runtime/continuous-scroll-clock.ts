import {
  createKpReaderClockSample,
  type KpReaderClockListener,
  type KpReaderClockSample,
  type KpReaderPlaybackClock
} from "./playback-clock.ts";

export interface KpReaderLinearScrollGeometry {
  readonly startPx: number;
  readonly endPx: number;
}

export interface KpReaderPiecewiseScrollStop {
  readonly positionPx: number;
  readonly progressPermille: number;
}

export interface KpReaderPiecewiseScrollGeometry {
  readonly stops: readonly KpReaderPiecewiseScrollStop[];
}

export type KpReaderScrollGeometry =
  | KpReaderLinearScrollGeometry
  | KpReaderPiecewiseScrollGeometry;

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
  const initialPosition = input.initialPositionPx ?? (
    "stops" in geometry ? geometry.stops[0]!.positionPx : geometry.startPx
  );
  const initialProgress = progressAt(initialPosition, geometry);
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

export function sampleKpReaderScrollPosition(
  progress: number,
  geometry: KpReaderScrollGeometry
): number {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new RangeError("scroll progress must be finite from zero through one");
  }
  const validated = validateGeometry(geometry);
  if (!("stops" in validated)) {
    return validated.startPx +
      (validated.endPx - validated.startPx) * progress;
  }
  return piecewisePositionAt(progress, validated.stops);
}

function progressAt(positionPx: number, geometry: KpReaderScrollGeometry): number {
  if (!Number.isFinite(positionPx)) throw new Error("scroll position must be finite");
  if ("stops" in geometry) return piecewiseProgressAt(positionPx, geometry.stops);
  return Math.min(1, Math.max(0,
    (positionPx - geometry.startPx) / (geometry.endPx - geometry.startPx)
  ));
}

function validateGeometry(geometry: KpReaderScrollGeometry): KpReaderScrollGeometry {
  if ("stops" in geometry) return { stops: validateStops(geometry.stops) };
  if (!Number.isFinite(geometry.startPx) || !Number.isFinite(geometry.endPx)) {
    throw new Error("scroll geometry must be finite");
  }
  if (geometry.endPx <= geometry.startPx) {
    throw new Error("scroll geometry end must follow start");
  }
  return { ...geometry };
}

function validateStops(
  stops: readonly KpReaderPiecewiseScrollStop[]
): readonly KpReaderPiecewiseScrollStop[] {
  if (stops.length < 2) throw new Error("piecewise scroll geometry needs at least two stops");
  let previousPosition = Number.NEGATIVE_INFINITY;
  let previousProgress = -1;
  const validated = stops.map((stop) => {
    if (!Number.isFinite(stop.positionPx) || stop.positionPx <= previousPosition) {
      throw new Error("piecewise scroll stop positions must be finite and strictly increasing");
    }
    if (!Number.isInteger(stop.progressPermille)
      || stop.progressPermille < 0
      || stop.progressPermille > 1_000
      || stop.progressPermille < previousProgress) {
      throw new Error("piecewise scroll progress must be ordered integers from 0 through 1000");
    }
    previousPosition = stop.positionPx;
    previousProgress = stop.progressPermille;
    return { ...stop };
  });
  if (validated[0]!.progressPermille !== 0
    || validated.at(-1)!.progressPermille !== 1_000) {
    throw new Error("piecewise scroll geometry must span progress 0 through 1000");
  }
  return validated;
}

function piecewiseProgressAt(
  positionPx: number,
  stops: readonly KpReaderPiecewiseScrollStop[]
): number {
  if (positionPx <= stops[0]!.positionPx) return 0;
  for (let index = 1; index < stops.length; index += 1) {
    const before = stops[index - 1]!;
    const after = stops[index]!;
    if (positionPx <= after.positionPx) {
      const local = (positionPx - before.positionPx) /
        (after.positionPx - before.positionPx);
      return (before.progressPermille
        + (after.progressPermille - before.progressPermille) * local) / 1_000;
    }
  }
  return 1;
}

function piecewisePositionAt(
  progress: number,
  stops: readonly KpReaderPiecewiseScrollStop[]
): number {
  const progressPermille = progress * 1_000;
  if (progressPermille <= stops[0]!.progressPermille) {
    return stops[0]!.positionPx;
  }
  for (let index = 1; index < stops.length; index += 1) {
    const before = stops[index - 1]!;
    const after = stops[index]!;
    if (progressPermille <= after.progressPermille) {
      const progressSpan =
        after.progressPermille - before.progressPermille;
      if (progressSpan === 0) return after.positionPx;
      const local =
        (progressPermille - before.progressPermille) / progressSpan;
      return before.positionPx +
        (after.positionPx - before.positionPx) * local;
    }
  }
  return stops.at(-1)!.positionPx;
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
