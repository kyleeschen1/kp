import type {
  KpBoundedClearanceSchedule,
  KpNotationPoint,
  KpScheduledGlyphMotion
} from "./bounded-glyph-clearance-scheduler.ts";

export interface KpStaticJsGlyphFrame {
  readonly matchId: string;
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly settled: boolean;
}

export interface KpStaticJsGlyphHost {
  readonly supportedMatchIds: ReadonlySet<string>;
  apply(frame: KpStaticJsGlyphFrame): void;
}

export interface KpStaticJsGlyphPlayback {
  readonly kind: "static-js-glyph-playback";
  readonly durationMs: number;
  sample(progress: number): readonly KpStaticJsGlyphFrame[];
  seek(progress: number): readonly KpStaticJsGlyphFrame[];
}

export function createKpStaticJsGlyphPlayback(input: {
  readonly schedule: KpBoundedClearanceSchedule;
  readonly host: KpStaticJsGlyphHost;
  readonly durationMs: number;
}): KpStaticJsGlyphPlayback {
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    throw new Error("Static-JS glyph playback requires a positive finite duration.");
  }
  input.schedule.motions.forEach(({ matchId }) => {
    if (!input.host.supportedMatchIds.has(matchId)) {
      throw new Error(`Static-JS glyph host lacks match ${matchId}.`);
    }
  });
  const sample = (progress: number): readonly KpStaticJsGlyphFrame[] => {
    const clamped = Math.max(0, Math.min(1, progress));
    return Object.freeze(input.schedule.motions.map((motion) =>
      sampleMotion(motion, clamped)
    ));
  };
  return Object.freeze({
    kind: "static-js-glyph-playback",
    durationMs: input.durationMs,
    sample,
    seek(progress: number) {
      const frames = sample(progress);
      frames.forEach(input.host.apply);
      return frames;
    }
  });
}

function sampleMotion(
  motion: KpScheduledGlyphMotion,
  progress: number
): KpStaticJsGlyphFrame {
  if (motion.status === "settle") {
    const destination = motion.waypoints[0] ?? { x: 0, y: 0 };
    return Object.freeze({
      matchId: motion.matchId,
      x: destination.x,
      y: destination.y,
      opacity: progress < 0.5 ? 0 : 1,
      settled: true
    });
  }
  const point = samplePolyline(motion.waypoints, progress);
  return Object.freeze({
    matchId: motion.matchId,
    x: point.x,
    y: point.y,
    opacity: 1,
    settled: false
  });
}

function samplePolyline(
  points: readonly KpNotationPoint[],
  progress: number
): KpNotationPoint {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 };
  const lengths = points.slice(1).map((point, index) => {
    const previous = points[index]!;
    return Math.hypot(point.x - previous.x, point.y - previous.y);
  });
  const total = lengths.reduce((sum, length) => sum + length, 0);
  if (total === 0) return points[points.length - 1]!;
  let remaining = progress * total;
  for (let index = 0; index < lengths.length; index += 1) {
    const length = lengths[index]!;
    if (remaining <= length || index === lengths.length - 1) {
      const from = points[index]!;
      const to = points[index + 1]!;
      const local = length === 0 ? 1 : Math.min(1, remaining / length);
      return {
        x: from.x + (to.x - from.x) * local,
        y: from.y + (to.y - from.y) * local
      };
    }
    remaining -= length;
  }
  return points[points.length - 1]!;
}
