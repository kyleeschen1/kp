export interface KpAnimationFramePerformance {
  readonly frames: number;
  readonly meanMs: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly over33Ms: number;
  readonly longestTaskMs: number;
}

export interface KpAnimationPerformanceSnapshot {
  readonly capturedAt: string;
  readonly artifacts: {
    readonly entryScriptBytes: number;
    readonly entryScriptGzipBytes: number;
    readonly threeScriptBytes: number;
    readonly threeScriptGzipBytes: number;
  };
  readonly normal: KpAnimationRuntimePerformance;
  readonly constrained: KpAnimationRuntimePerformance;
}

export interface KpAnimationRuntimePerformance {
  readonly hydrationMs: number;
  readonly initialScriptTransferBytes: number;
  readonly initialFontTransferBytes: number;
  readonly initialScriptNames: readonly string[];
  readonly matrixFrame: KpAnimationFramePerformance;
}

export interface KpAnimationPerformanceBaseline {
  readonly schemaVersion: "kp.animation-performance-baseline.v1";
  readonly snapshot: KpAnimationPerformanceSnapshot;
  readonly regressionAllowance: {
    readonly artifactRatio: number;
    readonly transferRatio: number;
  };
}

export interface KpAnimationPerformanceIssue {
  readonly severity: "regression" | "target";
  readonly metric: string;
  readonly actual: number | boolean;
  readonly limit: number | boolean;
  readonly message: string;
}

export const kpAnimationPerformanceTargets = Object.freeze({
  initialScriptTransferBytes: 250_000,
  constrainedHydrationMs: 5_000,
  constrainedFrameP95Ms: 33,
  constrainedFrameMaxMs: 100,
  longestTaskMs: 50,
  initialThreeRequested: false
});

export function evaluateKpAnimationPerformance(input: {
  readonly snapshot: KpAnimationPerformanceSnapshot;
  readonly baseline: KpAnimationPerformanceBaseline;
}): readonly KpAnimationPerformanceIssue[] {
  const { snapshot, baseline } = input;
  const issues: KpAnimationPerformanceIssue[] = [];

  // Regression limits preserve a usable ratchet while product targets keep
  // today's known bundle debt from becoming the accepted destination.
  maximumIssue(
    issues,
    "artifacts.entryScriptGzipBytes",
    snapshot.artifacts.entryScriptGzipBytes,
    baseline.snapshot.artifacts.entryScriptGzipBytes *
      baseline.regressionAllowance.artifactRatio,
    "regression"
  );
  maximumIssue(
    issues,
    "normal.initialScriptTransferBytes",
    snapshot.normal.initialScriptTransferBytes,
    baseline.snapshot.normal.initialScriptTransferBytes *
      baseline.regressionAllowance.transferRatio,
    "regression"
  );
  maximumIssue(
    issues,
    "constrained.initialScriptTransferBytes",
    snapshot.constrained.initialScriptTransferBytes,
    baseline.snapshot.constrained.initialScriptTransferBytes *
      baseline.regressionAllowance.transferRatio,
    "regression"
  );

  maximumIssue(
    issues,
    "normal.initialScriptTransferBytes.target",
    initialScriptTransferBytes(snapshot),
    kpAnimationPerformanceTargets.initialScriptTransferBytes,
    "target"
  );
  maximumIssue(
    issues,
    "constrained.hydrationMs",
    snapshot.constrained.hydrationMs,
    kpAnimationPerformanceTargets.constrainedHydrationMs,
    "target"
  );
  maximumIssue(
    issues,
    "constrained.matrixFrame.p95Ms",
    snapshot.constrained.matrixFrame.p95Ms,
    kpAnimationPerformanceTargets.constrainedFrameP95Ms,
    "target"
  );
  maximumIssue(
    issues,
    "constrained.matrixFrame.maxMs",
    snapshot.constrained.matrixFrame.maxMs,
    kpAnimationPerformanceTargets.constrainedFrameMaxMs,
    "target"
  );
  maximumIssue(
    issues,
    "constrained.matrixFrame.longestTaskMs",
    snapshot.constrained.matrixFrame.longestTaskMs,
    kpAnimationPerformanceTargets.longestTaskMs,
    "target"
  );

  const threeRequested = snapshot.normal.initialScriptNames.some((name) =>
    name.startsWith("graph-webgl-three-")
  );
  if (threeRequested !== kpAnimationPerformanceTargets.initialThreeRequested) {
    issues.push({
      severity: "target",
      metric: "normal.initialThreeRequested",
      actual: threeRequested,
      limit: kpAnimationPerformanceTargets.initialThreeRequested,
      message: "Three.js loaded before a visible 3D surface requested it."
    });
  }

  return issues;
}

export function initialScriptTransferBytes(
  snapshot: KpAnimationPerformanceSnapshot
): number {
  // Runtime transfer is authoritative once capability packs are lazy: summing
  // only the entry and Three artifacts would silently omit selected packs and
  // shared chunks fetched during hydration.
  return snapshot.normal.initialScriptTransferBytes;
}

function maximumIssue(
  issues: KpAnimationPerformanceIssue[],
  metric: string,
  actual: number,
  limit: number,
  severity: KpAnimationPerformanceIssue["severity"]
): void {
  if (actual <= limit) return;
  issues.push({
    severity,
    metric,
    actual,
    limit,
    message: `${metric} is ${formatNumber(actual)}; expected at most ${formatNumber(limit)}.`
  });
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
