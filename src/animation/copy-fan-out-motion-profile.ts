export const kpCanonicalNativeKatexCopyFanOutMotionProfile = {
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

export interface KpCanonicalNativeKatexCopyFanOutMotionFrame {
  readonly progress: number;
  readonly leaderProgress: number;
  readonly followerProgress: number;
  readonly followerOpacity: number;
  readonly productSettlementProgress: number;
  readonly addendReflowProgress: number;
}

const KP_COPY_FAN_OUT_REFLOW_PREVIEW_WEIGHT = 0.18;
const KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_WEIGHT =
  1 - KP_COPY_FAN_OUT_REFLOW_PREVIEW_WEIGHT;
const KP_COPY_FAN_OUT_REFLOW_PREVIEW_START = 0.08;
const KP_COPY_FAN_OUT_REFLOW_PREVIEW_END = 0.28;
const KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_START = 0.52;
const KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_END = 0.78;

/**
 * Samples the shared copy/fan-out topology without naming a symbolic family
 * or renderer. Distribution retains its public alias while other callers can
 * import this small profile without pulling an algebra pack.
 */
export function sampleKpCanonicalNativeKatexCopyFanOutMotion(
  inputProgress: number
): KpCanonicalNativeKatexCopyFanOutMotionFrame {
  const progress = clamp01(inputProgress);
  const rawAddendReflowProgress =
    KP_COPY_FAN_OUT_REFLOW_PREVIEW_WEIGHT * intervalProgress(
      progress,
      KP_COPY_FAN_OUT_REFLOW_PREVIEW_START,
      KP_COPY_FAN_OUT_REFLOW_PREVIEW_END
    ) +
    KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_WEIGHT * intervalProgress(
      progress,
      KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_START,
      KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_END
    );
  const rawFactorLeaderProgress = intervalProgress(
    progress,
    kpCanonicalNativeKatexCopyFanOutMotionProfile.leader.start,
    kpCanonicalNativeKatexCopyFanOutMotionProfile.leader.end
  );
  const productSettlementProgress = intervalProgress(
    progress,
    kpCanonicalNativeKatexCopyFanOutMotionProfile.settlement.cohesionLock,
    kpCanonicalNativeKatexCopyFanOutMotionProfile.settlement.nativeReady
  );
  const addendReflowProgress = settleAfterCohesionLock({
    progress,
    current: rawAddendReflowProgress,
    valueAtLock:
      KP_COPY_FAN_OUT_REFLOW_PREVIEW_WEIGHT * intervalProgress(
        kpCanonicalNativeKatexCopyFanOutMotionProfile.settlement.cohesionLock,
        KP_COPY_FAN_OUT_REFLOW_PREVIEW_START,
        KP_COPY_FAN_OUT_REFLOW_PREVIEW_END
      ) +
      KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_WEIGHT * intervalProgress(
        kpCanonicalNativeKatexCopyFanOutMotionProfile.settlement.cohesionLock,
        KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_START,
        KP_COPY_FAN_OUT_REFLOW_SETTLEMENT_END
      ),
    settlementProgress: productSettlementProgress
  });
  const factorLeaderProgress = settleAfterCohesionLock({
    progress,
    current: rawFactorLeaderProgress,
    valueAtLock: intervalProgress(
      kpCanonicalNativeKatexCopyFanOutMotionProfile.settlement.cohesionLock,
      kpCanonicalNativeKatexCopyFanOutMotionProfile.leader.start,
      kpCanonicalNativeKatexCopyFanOutMotionProfile.leader.end
    ),
    settlementProgress: productSettlementProgress
  });
  const factorFollowerProgress = intervalProgress(
    factorLeaderProgress,
    kpCanonicalNativeKatexCopyFanOutMotionProfile.follower.start,
    kpCanonicalNativeKatexCopyFanOutMotionProfile.follower.end
  );
  return Object.freeze({
    progress,
    leaderProgress: factorLeaderProgress,
    followerProgress: factorFollowerProgress,
    followerOpacity: intervalProgress(
      factorFollowerProgress,
      0,
      kpCanonicalNativeKatexCopyFanOutMotionProfile.follower.revealEnd
    ),
    productSettlementProgress,
    addendReflowProgress
  });
}

function settleAfterCohesionLock(input: {
  readonly progress: number;
  readonly current: number;
  readonly valueAtLock: number;
  readonly settlementProgress: number;
}): number {
  if (
    input.progress <=
    kpCanonicalNativeKatexCopyFanOutMotionProfile.settlement.cohesionLock
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
