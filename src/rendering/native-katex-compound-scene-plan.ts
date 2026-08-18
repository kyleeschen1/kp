import {
  sampleKpNativeKatexSceneTracks,
  type KpNativeKatexSceneTrackFrame
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexSceneTrack
} from "./native-katex-base-scene-plan.ts";

export interface KpNativeKatexCompoundTimeline {
  readonly operationIds: readonly string[];
  readonly compressedDurationMs: number;
  readonly segments: readonly {
    readonly operationId: string;
    readonly startMs: number;
    readonly durationMs: number;
    readonly endMs: number;
  }[];
}

export interface KpNativeKatexCompoundScene {
  readonly id: string;
  readonly operationId: string;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
}

export interface KpNativeKatexCompoundSceneSegment {
  readonly id: string;
  readonly sceneId: string;
  readonly operationId: string;
  readonly startMs: number;
  readonly durationMs: number;
  readonly endMs: number;
}

export interface KpNativeKatexCompoundSceneFrame {
  readonly kind: "native-katex-compound-scene-frame";
  readonly lifecycle: "renderer-session";
  readonly progress: number;
  readonly elapsedMs: number;
  readonly activeSceneIndex: number;
  readonly activeSceneId: string;
  readonly operationId: string;
  readonly localProgress: number;
  readonly visualOwner:
    | "source-native"
    | "material-scene"
    | "target-native";
  readonly materialSceneIds: readonly string[];
  readonly frames: readonly KpNativeKatexSceneTrackFrame[];
}

export interface KpNativeKatexCompoundScenePlan {
  readonly kind: "native-katex-compound-scene-plan";
  readonly lifecycle: "renderer-session";
  readonly scenes: readonly KpNativeKatexCompoundScene[];
  readonly segments: readonly KpNativeKatexCompoundSceneSegment[];
  readonly totalDurationMs: number;
  readonly sample: (progress: number) => KpNativeKatexCompoundSceneFrame;
}

export function createKpNativeKatexCompoundScenePlan(input: {
  readonly timeline: KpNativeKatexCompoundTimeline;
  readonly scenes: readonly KpNativeKatexCompoundScene[];
}): KpNativeKatexCompoundScenePlan {
  validateTimeline(input.timeline);
  const scenes = input.scenes.map((scene) => Object.freeze({
    ...scene,
    tracks: Object.freeze([...scene.tracks])
  }));
  if (scenes.length !== input.timeline.segments.length) {
    throw new Error(
      "A compound scene plan requires exactly one scene per timeline segment."
    );
  }
  if (new Set(scenes.map(({ id }) => id)).size !== scenes.length) {
    throw new Error("Compound scene IDs must be unique.");
  }
  const segments = input.timeline.segments.map((timelineSegment, index) => {
    const scene = scenes[index]!;
    if (scene.operationId !== timelineSegment.operationId) {
      throw new Error(
        `Compound scene ${scene.id} must retain canonical operation order.`
      );
    }
    if (scene.tracks.length === 0) {
      throw new Error(`Compound scene ${scene.id} requires generic tracks.`);
    }
    return Object.freeze({
      id: `compound-segment.${index}`,
      sceneId: scene.id,
      operationId: scene.operationId,
      startMs: timelineSegment.startMs,
      durationMs: timelineSegment.durationMs,
      endMs: timelineSegment.endMs
    });
  });
  const totalDurationMs = input.timeline.compressedDurationMs;
  const sample = (progress: number): KpNativeKatexCompoundSceneFrame => {
    if (!Number.isFinite(progress)) {
      throw new Error("Compound scene progress must be finite.");
    }
    const bounded = Math.max(0, Math.min(1, progress));
    const elapsedMs = bounded * totalDurationMs;
    const activeSceneIndex = elapsedMs === totalDurationMs
      ? segments.length - 1
      : segments.findIndex(({ endMs }) => elapsedMs < endMs);
    const segment = segments[activeSceneIndex]!;
    const scene = scenes[activeSceneIndex]!;
    const localProgress = bounded === 1
      ? 1
      : Math.max(
        0,
        Math.min(1, (elapsedMs - segment.startMs) / segment.durationMs)
      );
    const materialOwns = localProgress > 0 && localProgress < 1;
    return Object.freeze({
      kind: "native-katex-compound-scene-frame",
      lifecycle: "renderer-session",
      progress: bounded,
      elapsedMs,
      activeSceneIndex,
      activeSceneId: scene.id,
      operationId: scene.operationId,
      localProgress,
      visualOwner:
        localProgress === 0
          ? "source-native"
          : localProgress === 1
            ? "target-native"
            : "material-scene",
      materialSceneIds: Object.freeze(materialOwns ? [scene.id] : []),
      frames: sampleKpNativeKatexSceneTracks(scene.tracks, localProgress)
    });
  };
  return Object.freeze({
    kind: "native-katex-compound-scene-plan",
    lifecycle: "renderer-session",
    scenes: Object.freeze(scenes),
    segments: Object.freeze(segments),
    totalDurationMs,
    sample
  });
}

function validateTimeline(timeline: KpNativeKatexCompoundTimeline): void {
  if (
    timeline.operationIds.length === 0 ||
    timeline.operationIds.length !== timeline.segments.length ||
    !Number.isFinite(timeline.compressedDurationMs) ||
    timeline.compressedDurationMs <= 0
  ) {
    throw new Error("Compound scene timeline is incomplete.");
  }
  timeline.segments.forEach((segment, index) => {
    const previousEnd = index === 0 ? 0 : timeline.segments[index - 1]!.endMs;
    if (
      segment.operationId !== timeline.operationIds[index] ||
      segment.startMs !== previousEnd ||
      !Number.isFinite(segment.durationMs) ||
      segment.durationMs <= 0 ||
      segment.endMs !== segment.startMs + segment.durationMs
    ) {
      throw new Error(
        "Compound scene timeline must be contiguous and retain operation order."
      );
    }
  });
  if (timeline.segments.at(-1)!.endMs !== timeline.compressedDurationMs) {
    throw new Error(
      "Compound scene timeline must end at its compressed duration."
    );
  }
}
