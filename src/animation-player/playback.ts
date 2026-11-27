import { createKpGraph3DSaddleParameterAnimationAsset, sampleKpGraph3DSaddleParameterRuntimeFrame,
  type KpGraph3DSaddleParameterRuntimeFrame } from "../animation/graph-3d-saddle-parameter-asset.ts";
import { sampleKpAnimationRuntimeFrame } from "../animation/runtime-sampler.ts";
import { createKpReaderTimelinePlaybackClock, type KpReaderTimelinePlaybackScheduler } from "../reader/runtime/timeline-playback-clock.ts";
import { createGridGeometry, createSaddleGeometry } from "./geometry.ts";

const prepared = Symbol("prepared-saddle-animation");
export interface PreparedSaddleAnimation {
  readonly [prepared]: true;
  readonly id: string;
  readonly durationMs: number;
  readonly title: string;
}
const sources = new WeakMap<PreparedSaddleAnimation, {
  asset: ReturnType<typeof createKpGraph3DSaddleParameterAnimationAsset>;
  geometry: ReturnType<typeof createSaddleGeometry>; grid: Float32Array;
}>();

/** Compile once; each mount owns playback and GPU resources, never mathematical truth. */
export function prepareSaddleAnimation(): PreparedSaddleAnimation {
  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  const durationMs = asset.animation.timeline?.durationMs;
  if (durationMs === undefined) throw new Error("The saddle artifact requires a timeline duration.");
  const animation = Object.freeze({ [prepared]: true as const, id: asset.id, durationMs, title: asset.accessibility.title });
  // The private registration is the runtime authority; callers cannot forge a prepared artifact.
  const result: PreparedSaddleAnimation = animation;
  sources.set(result, { asset, geometry: createSaddleGeometry(), grid: createGridGeometry() });
  return result;
}
export function saddleSource(animation: PreparedSaddleAnimation) {
  const source = sources.get(animation);
  if (!source) throw new Error("Prepare this saddle animation before mounting or sampling it.");
  return source;
}
export function sampleSaddleAnimation(animation: PreparedSaddleAnimation, progress: number): KpGraph3DSaddleParameterRuntimeFrame {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new Error("Progress must be in 0…1.");
  const { asset } = saddleSource(animation);
  // The clock reports absolute source-to-target position even while reversing.
  // The domain sampler uses direction-relative progress, so feed its forward coordinate.
  return sampleKpGraph3DSaddleParameterRuntimeFrame({ asset,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation: asset.animation, direction: "forward", progress }) });
}
export interface SaddlePlaybackSnapshot {
  readonly progress: number;
  readonly status: "idle" | "playing" | "paused";
  readonly frame: KpGraph3DSaddleParameterRuntimeFrame;
}
export function createSaddlePlayback(animation: PreparedSaddleAnimation, options: {
  readonly initialProgress?: number; readonly scheduler?: KpReaderTimelinePlaybackScheduler; readonly ownerWindow?: Window;
} = {}) {
  saddleSource(animation);
  const clock = createKpReaderTimelinePlaybackClock({ id: animation.id, durationMs: animation.durationMs, ...options });
  const listeners = new Set<(snapshot: SaddlePlaybackSnapshot) => void>();
  let disposed = false;
  const live = () => { if (disposed) throw new Error("This player has been disposed."); };
  const snapshot = (): SaddlePlaybackSnapshot => { live(); const progress = clock.getSnapshot().progress;
    return { progress, status: clock.getStatus(), frame: sampleSaddleAnimation(animation, progress) }; };
  const publish = () => { const current = snapshot(); for (const listener of listeners) listener(current); };
  const unsubscribe = clock.subscribe(publish);
  return {
    snapshot,
    subscribe(listener: (snapshot: SaddlePlaybackSnapshot) => void) { live(); listeners.add(listener); return () => listeners.delete(listener); },
    seek(progress: number) { live(); clock.seek(progress); },
    play(direction: "forward" | "rewind" = "forward") { live(); clock.play({ direction, stopAt: direction === "forward" ? 1 : 0 }); publish(); },
    pause() { live(); clock.pause(); publish(); },
    dispose() { if (disposed) return; disposed = true; unsubscribe(); clock.dispose(); listeners.clear(); }
  };
}
export type SaddlePlayback = ReturnType<typeof createSaddlePlayback>;
