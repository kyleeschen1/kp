import { beats, columnExampleFromProduct, durationMs, type ColumnBeatId, type ColumnReading } from "./model.ts";
import type { matrixProduct } from "../../math/matrix-product.ts";
import { createKpFocusDeckCheckpointMap } from "../../tutorial/focus-deck-beat-navigation.ts";

export interface Stop {
  readonly id: string;
  readonly column: 0 | 1;
  readonly at: ColumnBeatId;
  readonly text: string;
}

export class WalkGap extends Error {
  override readonly name = "WalkGap";
  readonly code: "stop" | "bridge" | "progress";
  readonly path: string;
  constructor(code: WalkGap["code"], path: string, message: string) {
    super(`${path}: ${message}`);
    this.code = code; this.path = path;
  }
}

/** Local discovery format: author checkpoints, never compositor coordinates.
 * Durations are distances along accepted native motion, including rewinds. */
export function walk(product: ReturnType<typeof matrixProduct>, reading: ColumnReading, input: readonly Stop[]) {
  if (input.length < 2 || input.length > 32) throw new WalkGap("stop", "stops", "Choose 2–32 stops.");
  const ids = new Set<string>();
  const stops = Object.freeze(Array.from(input, (stop, i) => {
    if (!stop || !/^[a-z][a-z0-9-]*$/.test(stop.id) || ids.has(stop.id) ||
      ![0, 1].includes(stop.column) || !beats.some(beat => beat.id === stop.at) ||
      typeof stop.text !== "string" || !stop.text.trim() ||
      Object.keys(stop).some(key => !["id", "column", "at", "text"].includes(key))) {
      throw new WalkGap("stop", `stops[${i}]`, "Use a unique ID, column 0 or 1, a native checkpoint and nonempty text.");
    }
    ids.add(stop.id);
    return Object.freeze({ id: stop.id, column: stop.column, at: stop.at, text: stop.text });
  }));
  const native = stops.map(stop => beats.findIndex(beat => beat.id === stop.at));
  const distance = [0];
  for (let i = 1; i < stops.length; i++) {
    if (stops[i - 1]!.column !== stops[i]!.column && native[i - 1] !== 0 && native[i] !== 0)
      throw new WalkGap("bridge", `stops[${i}]`, "Return to initial before changing columns; no other visual bridge is demonstrated.");
    const travel = Math.abs(native[i]! - native[i - 1]!);
    if (!travel) throw new WalkGap("bridge", `stops[${i}]`, "Repeated poses have no travel. Pause at the existing stop instead.");
    distance.push(distance[i - 1]! + travel);
  }
  const total = distance.at(-1)!;
  const map = createKpFocusDeckCheckpointMap(distance.map(value => value / total));
  const scenes = Object.freeze([
    columnExampleFromProduct(product, 0, reading), columnExampleFromProduct(product, 1, reading)
  ] as const);
  return Object.freeze({
    stops, scenes, checkpoints: map.checkpoints, durationMs: durationMs * total / (beats.length - 1),
    sample(progress: number) {
      if (!Number.isFinite(progress) || progress < 0 || progress > 1)
        throw new WalkGap("progress", "progress", "Use a finite normalized position.");
      const raw = map.positionAt(progress), nearest = Math.round(raw);
      // Exact authored endpoints must retain native ownership despite division
      // roundoff; this tolerance is far below any visible transit interval.
      const position = Math.abs(raw - nearest) < 1e-10 ? nearest : raw;
      const from = Math.floor(position), to = Math.ceil(position), local = position - from;
      const stop = stops[to]!;
      const column = from === to ? stop.column : native[from] === 0 ? stop.column : stops[from]!.column;
      const nativeProgress = (native[from]! + (native[to]! - native[from]!) * local) / (beats.length - 1);
      return { position, index: to, stop, column, nativeProgress };
    }
  });
}
export type Walk = ReturnType<typeof walk>;
