export interface KpAnimationFramePerformance {
  readonly frames: number;
  readonly meanMs: number;
  readonly p95Ms: number;
  readonly p99Ms: number;
  readonly maxMs: number;
  readonly over33Ms: number;
  readonly longestTaskMs: number;
  readonly diagnosticPublishes?: number | undefined;
  readonly inspectionPublishes?: number | undefined;
  readonly layoutCacheBuilds?: number | undefined;
  readonly overlayGeometryMeasures?: number | undefined;
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
  readonly route?: string | undefined;
  readonly animationId?: string | undefined;
  readonly hydrationMs: number;
  readonly initialScriptTransferBytes: number;
  readonly initialFontTransferBytes: number;
  readonly initialScriptNames: readonly string[];
  readonly coreWebVitals?: {
    readonly lcpMs: number;
    readonly cls: number;
    // A deterministic lab proxy; public INP still requires field collection.
    readonly interactionPaintMs: number;
    readonly longestTaskMs?: number | undefined;
    readonly layoutShiftSources?: readonly string[] | undefined;
    readonly observedEntryTypes?: readonly string[] | undefined;
  } | undefined;
  readonly animationFrame?: KpAnimationFramePerformance | undefined;
  /** Retained only so the 2026-07-17 baseline remains readable. */
  readonly matrixFrame?: KpAnimationFramePerformance | undefined;
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
  frameWindowDiagnosticPublishes: 40,
  frameWindowInspectionPublishes: 40,
  frameWindowLayoutCacheBuilds: 24,
  frameWindowOverlayGeometryMeasures: 24,
  lcpMs: 2_500,
  cls: 0.1,
  interactionPaintMs: 200,
  loadingLongestTaskMs: 50,
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
  optionalMaximumIssue(
    issues,
    "constrained.coreWebVitals.lcpMs",
    snapshot.constrained.coreWebVitals?.lcpMs,
    kpAnimationPerformanceTargets.lcpMs,
    "target"
  );
  optionalMaximumIssue(
    issues,
    "normal.coreWebVitals.cls",
    snapshot.normal.coreWebVitals?.cls,
    kpAnimationPerformanceTargets.cls,
    "target"
  );
  optionalMaximumIssue(
    issues,
    "constrained.coreWebVitals.cls",
    snapshot.constrained.coreWebVitals?.cls,
    kpAnimationPerformanceTargets.cls,
    "target"
  );
  optionalMaximumIssue(
    issues,
    "constrained.coreWebVitals.interactionPaintMs",
    snapshot.constrained.coreWebVitals?.interactionPaintMs,
    kpAnimationPerformanceTargets.interactionPaintMs,
    "target"
  );
  optionalMaximumIssue(
    issues,
    "constrained.coreWebVitals.longestTaskMs",
    snapshot.constrained.coreWebVitals?.longestTaskMs,
    kpAnimationPerformanceTargets.loadingLongestTaskMs,
    "target"
  );
  const constrainedFrame = measuredFrame(snapshot.constrained);
  optionalMaximumIssue(
    issues,
    "constrained.animationFrame.diagnosticPublishes",
    constrainedFrame.diagnosticPublishes,
    kpAnimationPerformanceTargets.frameWindowDiagnosticPublishes,
    "target"
  );
  optionalMaximumIssue(
    issues,
    "constrained.animationFrame.inspectionPublishes",
    constrainedFrame.inspectionPublishes,
    kpAnimationPerformanceTargets.frameWindowInspectionPublishes,
    "target"
  );
  optionalMaximumIssue(
    issues,
    "constrained.animationFrame.layoutCacheBuilds",
    constrainedFrame.layoutCacheBuilds,
    kpAnimationPerformanceTargets.frameWindowLayoutCacheBuilds,
    "target"
  );
  optionalMaximumIssue(
    issues,
    "constrained.animationFrame.overlayGeometryMeasures",
    constrainedFrame.overlayGeometryMeasures,
    kpAnimationPerformanceTargets.frameWindowOverlayGeometryMeasures,
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
    "constrained.animationFrame.p95Ms",
    constrainedFrame.p95Ms,
    kpAnimationPerformanceTargets.constrainedFrameP95Ms,
    "target"
  );
  maximumIssue(
    issues,
    "constrained.animationFrame.maxMs",
    constrainedFrame.maxMs,
    kpAnimationPerformanceTargets.constrainedFrameMaxMs,
    "target"
  );
  maximumIssue(
    issues,
    "constrained.animationFrame.longestTaskMs",
    constrainedFrame.longestTaskMs,
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

function measuredFrame(
  runtime: KpAnimationRuntimePerformance
): KpAnimationFramePerformance {
  const frame = runtime.animationFrame ?? runtime.matrixFrame;
  if (frame === undefined) {
    throw new Error("Animation performance snapshot lacks a measured frame window.");
  }
  return frame;
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

function optionalMaximumIssue(
  issues: KpAnimationPerformanceIssue[],
  metric: string,
  actual: number | undefined,
  limit: number,
  severity: KpAnimationPerformanceIssue["severity"]
): void {
  if (actual === undefined) return;
  maximumIssue(issues, metric, actual, limit, severity);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
