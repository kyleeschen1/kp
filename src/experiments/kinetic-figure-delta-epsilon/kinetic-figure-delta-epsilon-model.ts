import { normalizeAnimationProgress } from "../../animation/kernel.ts";

export const KP_DELTA_EPSILON_FOCUS_DECK_MODEL_ID =
  "focus-deck.delta-epsilon-limit.v1" as const;
export const KP_DELTA_EPSILON_FOCUS_DECK_CLOCK_ID =
  "clock.focus-deck.delta-epsilon-limit.v1" as const;
export const kpDeltaEpsilonMotionStartProgress = 0.58;

export const kpDeltaEpsilonFocusDeckBeatIds = [
  "read-limit",
  "inspect-hole",
  "set-output-challenge",
  "choose-input-window",
  "reintegrate-proof"
] as const;

export type KpDeltaEpsilonFocusDeckBeatId =
  (typeof kpDeltaEpsilonFocusDeckBeatIds)[number];
export type KpDeltaEpsilonFocusDeckLens = "context" | "inspect";
export type KpDeltaEpsilonInterpretivePhase =
  | "establish-whole"
  | "isolate-part"
  | "relate"
  | "reintegrate";

export interface KpDeltaEpsilonFocusDeckBeat {
  readonly id: KpDeltaEpsilonFocusDeckBeatId;
  readonly ordinal: number;
  readonly label: string;
  readonly phase: KpDeltaEpsilonInterpretivePhase;
  readonly progress: number;
  readonly focusEntityIds: readonly KpDeltaEpsilonEntityId[];
  readonly ownsMotion: boolean;
}

export const kpDeltaEpsilonEntityIds = [
  "curve",
  "hole",
  "epsilon-band",
  "delta-window",
  "sample-point",
  "distance-relation",
  "formal-definition"
] as const;
export type KpDeltaEpsilonEntityId =
  (typeof kpDeltaEpsilonEntityIds)[number];
export type KpDeltaEpsilonEntitySalience = "context" | "focus" | "normal";

export interface KpDeltaEpsilonFocusDeckFrame {
  readonly modelId: typeof KP_DELTA_EPSILON_FOCUS_DECK_MODEL_ID;
  readonly beatId: KpDeltaEpsilonFocusDeckBeatId;
  readonly lens: KpDeltaEpsilonFocusDeckLens;
  readonly phase: KpDeltaEpsilonInterpretivePhase;
  readonly progress: number;
  readonly epsilonRadius: number;
  readonly deltaRadius: number;
  readonly sampleX: number;
  readonly sampleY: number;
  readonly epsilonBandPresent: boolean;
  readonly deltaWindowPresent: boolean;
  readonly samplePointPresent: boolean;
  readonly relationPresent: boolean;
  readonly definitionPresent: boolean;
  readonly entitySalience: Readonly<Record<
    KpDeltaEpsilonEntityId,
    KpDeltaEpsilonEntitySalience
  >>;
}

export const kpDeltaEpsilonFocusDeckBeats:
readonly KpDeltaEpsilonFocusDeckBeat[] = Object.freeze([
  beat("read-limit", 1, "Read the limit", "establish-whole", 0,
    ["curve", "formal-definition"]),
  beat("inspect-hole", 2, "Inspect the hole", "isolate-part", 0.18,
    ["hole"]),
  beat("set-output-challenge", 3, "Set the output challenge", "isolate-part",
    0.38, ["epsilon-band"]),
  beat("choose-input-window", 4, "Choose the input window", "relate",
    kpDeltaEpsilonMotionStartProgress, ["delta-window", "epsilon-band"]),
  beat("reintegrate-proof", 5, "Connect the definition", "reintegrate", 1,
    ["sample-point", "distance-relation", "formal-definition"], true)
]);

export function readKpDeltaEpsilonFocusDeckBeat(
  value: string | undefined
): KpDeltaEpsilonFocusDeckBeat {
  return kpDeltaEpsilonFocusDeckBeats.find(({ id }) => id === value) ??
    kpDeltaEpsilonFocusDeckBeats[0]!;
}

export function readKpDeltaEpsilonFocusDeckBeatFromHash(
  hash: string
): KpDeltaEpsilonFocusDeckBeat {
  return readKpDeltaEpsilonFocusDeckBeat(
    hash.startsWith("#beat.") ? hash.slice("#beat.".length) : undefined
  );
}

export function kpDeltaEpsilonFocusDeckHash(
  beatId: KpDeltaEpsilonFocusDeckBeatId
): string {
  return `#beat.${beatId}`;
}

export function adjacentKpDeltaEpsilonFocusDeckBeat(input: {
  readonly beatId: KpDeltaEpsilonFocusDeckBeatId;
  readonly direction: -1 | 1;
}): KpDeltaEpsilonFocusDeckBeat {
  const index = kpDeltaEpsilonFocusDeckBeatIds.indexOf(input.beatId);
  const adjacent = Math.max(0, Math.min(
    kpDeltaEpsilonFocusDeckBeats.length - 1,
    index + input.direction
  ));
  return kpDeltaEpsilonFocusDeckBeats[adjacent]!;
}

export function sampleKpDeltaEpsilonFocusDeckFrame(input: {
  readonly beatId: KpDeltaEpsilonFocusDeckBeatId;
  readonly lens: KpDeltaEpsilonFocusDeckLens;
  readonly progress: number;
}): KpDeltaEpsilonFocusDeckFrame {
  const beat = readKpDeltaEpsilonFocusDeckBeat(input.beatId);
  const progress = normalizeAnimationProgress(input.progress);
  const relationProgress = smoothstep(range(
    progress,
    kpDeltaEpsilonMotionStartProgress,
    1
  ));
  const epsilonBandPresent = progress >= 0.38;
  const deltaWindowPresent = progress >= kpDeltaEpsilonMotionStartProgress;
  const epsilonRadius = mix(0.86, 0.34, relationProgress);
  const deltaRadius = epsilonRadius;
  const sampleX = 1 + deltaRadius * 0.72;
  const sampleY = sampleX + 1;
  const focusIds = new Set(beat.focusEntityIds);
  const entitySalience = Object.fromEntries(
    kpDeltaEpsilonEntityIds.map((id) => [
      id,
      input.lens === "context"
        ? "normal"
        : focusIds.has(id) ? "focus" : "context"
    ])
  ) as Record<KpDeltaEpsilonEntityId, KpDeltaEpsilonEntitySalience>;

  return Object.freeze({
    modelId: KP_DELTA_EPSILON_FOCUS_DECK_MODEL_ID,
    beatId: beat.id,
    lens: input.lens,
    phase: beat.phase,
    progress,
    epsilonRadius,
    deltaRadius,
    sampleX,
    sampleY,
    epsilonBandPresent,
    deltaWindowPresent,
    samplePointPresent: progress >= kpDeltaEpsilonMotionStartProgress,
    relationPresent: progress > kpDeltaEpsilonMotionStartProgress,
    definitionPresent: progress >= 0.9,
    entitySalience: Object.freeze(entitySalience)
  });
}

function beat(
  id: KpDeltaEpsilonFocusDeckBeatId,
  ordinal: number,
  label: string,
  phase: KpDeltaEpsilonInterpretivePhase,
  progress: number,
  focusEntityIds: readonly KpDeltaEpsilonEntityId[],
  ownsMotion = false
): KpDeltaEpsilonFocusDeckBeat {
  return Object.freeze({
    id,
    ordinal,
    label,
    phase,
    progress,
    focusEntityIds: Object.freeze([...focusEntityIds]),
    ownsMotion
  });
}

function range(value: number, start: number, end: number): number {
  return normalizeAnimationProgress((value - start) / (end - start));
}

function mix(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}
