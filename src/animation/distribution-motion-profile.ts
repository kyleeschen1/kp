export const kpLessonCanonicalDistributionMotionProfile = {
  leader: {
    start: 0,
    end: 1,
    arcPx: -8
  },
  follower: {
    start: 0.42,
    end: 1,
    revealEnd: 0.12,
    arcPx: -12
  },
  settlement: {
    cohesionLock: 0.72,
    nativeReady: 0.94
  }
} as const;

export interface KpLessonCanonicalDistributionMotionFrame {
  readonly progress: number;
  readonly leaderProgress: number;
  readonly followerProgress: number;
  readonly followerOpacity: number;
  readonly productSettlementProgress: number;
  readonly addendReflowProgress: number;
}

/**
 * The promoted distribution timing is renderer-neutral. Keeping it separate
 * prevents the shared compositor from importing the authoring/runtime graph.
 */
export function sampleKpLessonCanonicalDistributionMotion(
  inputProgress: number
): KpLessonCanonicalDistributionMotionFrame {
  const progress = clamp01(inputProgress);
  // A small preview shift anchors attention; the topology-changing reflow waits
  // until grouping removal makes enough horizontal room for the products.
  const rawAddendReflowProgress =
    0.18 * intervalProgress(progress, 0.08, 0.28) +
    0.82 * intervalProgress(progress, 0.52, 0.78);
  const rawFactorLeaderProgress = intervalProgress(
    progress,
    kpLessonCanonicalDistributionMotionProfile.leader.start,
    kpLessonCanonicalDistributionMotionProfile.leader.end
  );
  const productSettlementProgress = intervalProgress(
    progress,
    kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
    kpLessonCanonicalDistributionMotionProfile.settlement.nativeReady
  );
  const addendReflowProgress = settleAfterCohesionLock({
    progress,
    current: rawAddendReflowProgress,
    valueAtLock:
      0.18 * intervalProgress(
        kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
        0.08,
        0.28
      ) +
      0.82 * intervalProgress(
        kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
        0.52,
        0.78
      ),
    settlementProgress: productSettlementProgress
  });
  const factorLeaderProgress = settleAfterCohesionLock({
    progress,
    current: rawFactorLeaderProgress,
    valueAtLock: intervalProgress(
      kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
      kpLessonCanonicalDistributionMotionProfile.leader.start,
      kpLessonCanonicalDistributionMotionProfile.leader.end
    ),
    settlementProgress: productSettlementProgress
  });
  const factorFollowerProgress = intervalProgress(
    factorLeaderProgress,
    kpLessonCanonicalDistributionMotionProfile.follower.start,
    kpLessonCanonicalDistributionMotionProfile.follower.end
  );
  return {
    progress,
    leaderProgress: factorLeaderProgress,
    followerProgress: factorFollowerProgress,
    followerOpacity: intervalProgress(
      factorFollowerProgress,
      0,
      kpLessonCanonicalDistributionMotionProfile.follower.revealEnd
    ),
    productSettlementProgress,
    addendReflowProgress
  };
}

function settleAfterCohesionLock(input: {
  readonly progress: number;
  readonly current: number;
  readonly valueAtLock: number;
  readonly settlementProgress: number;
}): number {
  if (
    input.progress <=
    kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock
  ) {
    return input.current;
  }
  return input.valueAtLock +
    (1 - input.valueAtLock) * input.settlementProgress;
}

function intervalProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
