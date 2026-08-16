import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export interface KpNativeKatexTrackProjection {
  readonly kind: "native-katex-track-projection";
  readonly id: string;
  readonly project: (input: {
    readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
    readonly source: KpNativeKatexRenderedSceneObservation;
    readonly target: KpNativeKatexRenderedSceneObservation;
  }) => readonly KpNativeKatexPaintMeasuredSceneTrack[];
}

const projections = new WeakSet<object>();

export function createKpNativeKatexTrackProjection(input: {
  readonly id: string;
  readonly project: KpNativeKatexTrackProjection["project"];
}): KpNativeKatexTrackProjection {
  if (input.id.trim().length === 0) {
    throw new Error("Native KaTeX track projections require a non-empty id.");
  }
  const projection = Object.freeze({
    kind: "native-katex-track-projection" as const,
    id: input.id,
    project: input.project
  });
  projections.add(projection);
  return projection;
}

export function applyKpNativeKatexTrackProjection(input: {
  readonly projection?: KpNativeKatexTrackProjection | undefined;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  if (input.projection === undefined) return input.tracks;
  if (!projections.has(input.projection)) {
    throw new Error("Native KaTeX track projection requires original capability authority.");
  }
  const projected = input.projection.project(input);
  if (
    projected.length !== input.tracks.length ||
    projected.some((track, index) => track.id !== input.tracks[index]!.id)
  ) {
    throw new Error("Native KaTeX track projections must preserve exact track identity and order.");
  }
  return Object.freeze([...projected]);
}
