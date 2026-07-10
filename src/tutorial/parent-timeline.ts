import { normalizeAnimationProgress } from "../animation/kernel.ts";
import type { KpTutorialCardRuntimeContext } from "./card-runtime.ts";

export type KpParentTimelineTrackKind =
  | "layout"
  | "semantic-object"
  | "transformation";

export interface KpParentTimelineTrack {
  readonly id: string;
  readonly kind: KpParentTimelineTrackKind;
  readonly targetId: string;
  readonly startProgress: number;
  readonly endProgress: number;
  readonly startBeat: number;
  readonly endBeat: number;
  readonly order: number;
  readonly sampleable: boolean;
  readonly reversible: boolean;
  readonly summary?: string | undefined;
}

export interface KpParentTimeline {
  readonly id: string;
  readonly clockId: string | undefined;
  readonly layoutId: string | undefined;
  readonly durationMs: number;
  readonly beatCount: number;
  readonly sampleable: boolean;
  readonly reversible: boolean;
  readonly tracks: readonly KpParentTimelineTrack[];
}

export interface KpParentTimelineFrame {
  readonly timelineId: string;
  readonly clockId: string | undefined;
  readonly progress: number;
  readonly beat: number;
  readonly elapsedMs: number;
  readonly tracks: readonly KpParentTimelineTrackFrame[];
}

export interface KpParentTimelineTrackFrame {
  readonly trackId: string;
  readonly kind: KpParentTimelineTrackKind;
  readonly targetId: string;
  readonly active: boolean;
  readonly progress: number;
  readonly localProgress: number;
  readonly startProgress: number;
  readonly endProgress: number;
}

export function createKpParentTimelineFromRuntimeContext(
  context: KpTutorialCardRuntimeContext
): KpParentTimeline {
  const timeline = context.sharedTimeline;

  if (timeline === undefined) {
    throw new Error(
      `Tutorial card ${context.manifestId} does not declare a shared timeline.`
    );
  }

  const beatCount = timeline.beatCount ?? 1;
  const sampleable = timeline.sampleable ?? false;
  const reversible = timeline.reversible ?? false;
  const tracks: KpParentTimelineTrack[] = [];

  if (context.rootLayout !== undefined) {
    tracks.push(
      createFullSpanTrack({
        timelineId: timeline.id,
        kind: "layout",
        targetId: context.rootLayout.id,
        beatCount,
        order: tracks.length,
        sampleable,
        reversible,
        summary: context.rootLayout.summary
      })
    );
  }

  for (const semanticObject of context.semanticObjectsById.values()) {
    tracks.push(
      createFullSpanTrack({
        timelineId: timeline.id,
        kind: "semantic-object",
        targetId: semanticObject.objectId,
        beatCount,
        order: tracks.length,
        sampleable,
        reversible
      })
    );
  }

  const transformationRefs = [...context.transformationsById.values()];
  transformationRefs.forEach((transformation, index) => {
    const startProgress = index / transformationRefs.length;
    const endProgress = (index + 1) / transformationRefs.length;
    const startBeat = (index * beatCount) / transformationRefs.length;
    const endBeat = ((index + 1) * beatCount) / transformationRefs.length;

    tracks.push({
      id: `${timeline.id}.transformation.${transformation.id}`,
      kind: "transformation",
      targetId: transformation.id,
      startProgress,
      endProgress,
      startBeat,
      endBeat,
      order: tracks.length,
      sampleable,
      reversible,
      ...(transformation.summary === undefined
        ? {}
        : { summary: transformation.summary })
    });
  });

  return {
    id: timeline.id,
    clockId: timeline.clockId,
    layoutId: timeline.layoutId,
    durationMs: timeline.durationMs ?? 0,
    beatCount,
    sampleable,
    reversible,
    tracks
  };
}

export function sampleKpParentTimeline(
  timeline: KpParentTimeline,
  progress: number
): KpParentTimelineFrame {
  const clampedProgress = normalizeAnimationProgress(progress);

  return {
    timelineId: timeline.id,
    clockId: timeline.clockId,
    progress: clampedProgress,
    beat: clampedProgress * timeline.beatCount,
    elapsedMs: clampedProgress * timeline.durationMs,
    tracks: timeline.tracks.map((track) => ({
      trackId: track.id,
      kind: track.kind,
      targetId: track.targetId,
      active: isTrackActive(track, clampedProgress),
      progress: clampedProgress,
      localProgress: localTrackProgress(track, clampedProgress),
      startProgress: track.startProgress,
      endProgress: track.endProgress
    }))
  };
}

interface FullSpanTrackInput {
  readonly timelineId: string;
  readonly kind: Exclude<KpParentTimelineTrackKind, "transformation">;
  readonly targetId: string;
  readonly beatCount: number;
  readonly order: number;
  readonly sampleable: boolean;
  readonly reversible: boolean;
  readonly summary?: string | undefined;
}

function createFullSpanTrack(input: FullSpanTrackInput): KpParentTimelineTrack {
  return {
    id: `${input.timelineId}.${input.kind}.${input.targetId}`,
    kind: input.kind,
    targetId: input.targetId,
    startProgress: 0,
    endProgress: 1,
    startBeat: 0,
    endBeat: input.beatCount,
    order: input.order,
    sampleable: input.sampleable,
    reversible: input.reversible,
    ...(input.summary === undefined ? {} : { summary: input.summary })
  };
}

function isTrackActive(
  track: KpParentTimelineTrack,
  progress: number
): boolean {
  return progress >= track.startProgress && progress <= track.endProgress;
}

function localTrackProgress(
  track: KpParentTimelineTrack,
  progress: number
): number {
  if (track.endProgress <= track.startProgress) {
    return progress >= track.endProgress ? 1 : 0;
  }

  return roundTimelineProgress(
    normalizeAnimationProgress(
      (progress - track.startProgress) /
        (track.endProgress - track.startProgress)
    )
  );
}

function roundTimelineProgress(progress: number): number {
  return Number(progress.toFixed(12));
}
