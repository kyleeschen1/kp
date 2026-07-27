import {
  kpLessonCanonicalDistributionMotionProfile,
  sampleKpLessonCanonicalDistributionMotion
} from "../animation/distribution-motion-profile.ts";
import {
  sampleKpEquationMotionTrackRect
} from "./equation-motion-path-planner.ts";
import type {
  KpStageRelativeRect
} from "./native-katex-fragment-observer.ts";
import type {
  KpNativeKatexSceneTrack
} from "./native-katex-scene-compositor.ts";

/**
 * Projects the promoted copy/fan-out schedule onto measured native paint.
 * Semantic lineage chooses the tracks; this helper owns only sampled motion.
 */
export function sampleKpNativeKatexCopyFanOutTrack(input: {
  readonly track: KpNativeKatexSceneTrack;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
  readonly progress: number;
}): readonly [
  rect: KpStageRelativeRect,
  paintProgress: number,
  opacityProgress?: number
] {
  const motion = sampleKpLessonCanonicalDistributionMotion(input.progress);
  if (input.track.lifecycle === "persist") {
    return [
      sampleKpEquationMotionTrackRect(
        input.track,
        motion.addendReflowProgress
      ),
      motion.addendReflowProgress
    ];
  }
  if (input.track.lifecycle !== "split") {
    const paintProgress = smoothstep(input.progress);
    const rect = sampleKpEquationMotionTrackRect(input.track, paintProgress);
    const opacityProgress =
      // Departing grouping paint clears before the first addend preview at
      // 0.08, preventing native adjacency from becoming transit crowding.
      input.track.lifecycle === "eliminate"
        ? intervalProgress(input.progress, 0, 0.08)
        : input.track.lifecycle === "introduce"
          ? intervalProgress(input.progress, 0.78, 0.94)
          : undefined;
    return opacityProgress === undefined
      ? [rect, paintProgress]
      : [rect, paintProgress, opacityProgress];
  }
  if (motion.leaderProgress === 0) {
    return [{ ...input.track.startRect }, 0];
  }
  if (
    motion.leaderProgress === 1 &&
    motion.followerProgress === 1
  ) {
    return [{ ...input.track.endRect }, 1];
  }
  const branches = input.tracks
    .filter((candidate) =>
      candidate.lifecycle === "split" &&
      candidate.componentId === input.track.componentId
    )
    .sort((left, right) =>
      rectCenterX(left.endRect) - rectCenterX(right.endRect) ||
      left.id.localeCompare(right.id)
    );
  const leader = branches[0];
  if (leader === undefined) {
    throw new Error(
      `Copy/fan-out track ${input.track.id} has no component leader.`
    );
  }
  const leaderCenter = {
    x: interpolate(
      rectCenterX(leader.startRect),
      rectCenterX(leader.endRect),
      motion.leaderProgress
    ),
    y:
      interpolate(
        rectCenterY(leader.startRect),
        rectCenterY(leader.endRect),
        motion.leaderProgress
      ) +
      kpLessonCanonicalDistributionMotionProfile.leader.arcPx *
        Math.sin(Math.PI * motion.leaderProgress)
  };
  const isLeader = input.track.id === leader.id;
  const branchProgress = isLeader
    ? motion.leaderProgress
    : motion.followerProgress;
  const center = isLeader
    ? leaderCenter
    : {
        // Opaque followers coincide with the leader until branch time, then
        // peel away; semantic fission never has to reveal through a crossfade.
        x: interpolate(
          leaderCenter.x,
          rectCenterX(input.track.endRect),
          motion.followerProgress
        ),
        y:
          interpolate(
            leaderCenter.y,
            rectCenterY(input.track.endRect),
            motion.followerProgress
          ) +
          kpLessonCanonicalDistributionMotionProfile.follower.arcPx *
            Math.sin(Math.PI * motion.followerProgress)
      };
  const leaderWidth = interpolate(
    leader.startRect.width,
    leader.endRect.width,
    motion.leaderProgress
  );
  const leaderHeight = interpolate(
    leader.startRect.height,
    leader.endRect.height,
    motion.leaderProgress
  );
  const width = isLeader
    ? leaderWidth
    : interpolate(leaderWidth, input.track.endRect.width, branchProgress);
  const height = isLeader
    ? leaderHeight
    : interpolate(leaderHeight, input.track.endRect.height, branchProgress);
  return [
    {
      left: center.x - width / 2,
      top: center.y - height / 2,
      width,
      height
    },
    branchProgress
  ];
}

function rectCenterX(rect: KpStageRelativeRect): number {
  return rect.left + rect.width / 2;
}

function rectCenterY(rect: KpStageRelativeRect): number {
  return rect.top + rect.height / 2;
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function intervalProgress(progress: number, start: number, end: number): number {
  return smoothstep(Math.max(0, Math.min(1, (progress - start) / (end - start))));
}
