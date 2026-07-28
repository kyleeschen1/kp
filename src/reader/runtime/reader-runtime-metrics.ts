export interface KpReaderRuntimeMetricsSnapshot {
  readonly scrollGeometryReads: number;
  readonly scrollAnchorReads: number;
  readonly canonicalSessionBuilds: number;
  readonly canonicalSessionBuildDurationMs: number;
  readonly canonicalSessionReuses: number;
  readonly canonicalSessionApplies: number;
  readonly purePlanCompilations: number;
  readonly purePlanCacheHits: number;
  readonly protectedTransitCompilations: number;
  readonly protectedTransitCertificateReuses: number;
  readonly adjacentPrewarmCompilations: number;
}

interface MutableKpReaderRuntimeMetrics {
  scrollGeometryReads: number;
  scrollAnchorReads: number;
  canonicalSessionBuilds: number;
  canonicalSessionBuildDurationMs: number;
  canonicalSessionReuses: number;
  canonicalSessionApplies: number;
  purePlanCompilations: number;
  purePlanCacheHits: number;
  protectedTransitCompilations: number;
  protectedTransitCertificateReuses: number;
  adjacentPrewarmCompilations: number;
}

const metricsByWindow = new WeakMap<Window, MutableKpReaderRuntimeMetrics>();

export function inspectKpReaderRuntimeMetrics(
  ownerWindow: Window
): KpReaderRuntimeMetricsSnapshot {
  return Object.freeze({ ...metricsFor(ownerWindow) });
}

export function resetKpReaderRuntimeMetrics(ownerWindow: Window): void {
  metricsByWindow.set(ownerWindow, createMetrics());
}

export function recordKpReaderScrollGeometryRead(ownerWindow: Window): void {
  metricsFor(ownerWindow).scrollGeometryReads += 1;
}

export function recordKpReaderScrollAnchorRead(ownerWindow: Window): void {
  metricsFor(ownerWindow).scrollAnchorReads += 1;
}

export function recordKpReaderCanonicalSessionBuild(
  ownerWindow: Window,
  durationMs: number
): void {
  const metrics = metricsFor(ownerWindow);
  metrics.canonicalSessionBuilds += 1;
  metrics.canonicalSessionBuildDurationMs += Math.max(0, durationMs);
}

export function recordKpReaderCanonicalSessionReuse(
  ownerWindow: Window
): void {
  metricsFor(ownerWindow).canonicalSessionReuses += 1;
}

export function recordKpReaderCanonicalSessionApply(
  ownerWindow: Window
): void {
  metricsFor(ownerWindow).canonicalSessionApplies += 1;
}

export function recordKpReaderPurePlanCompilation(ownerWindow: Window): void {
  metricsFor(ownerWindow).purePlanCompilations += 1;
}

export function recordKpReaderPurePlanCacheHit(ownerWindow: Window): void {
  metricsFor(ownerWindow).purePlanCacheHits += 1;
}

export function recordKpReaderProtectedTransitCompilation(
  ownerWindow: Window
): void {
  metricsFor(ownerWindow).protectedTransitCompilations += 1;
}

export function recordKpReaderProtectedTransitCertificateReuse(
  ownerWindow: Window
): void {
  metricsFor(ownerWindow).protectedTransitCertificateReuses += 1;
}

export function recordKpReaderAdjacentPrewarmCompilation(
  ownerWindow: Window
): void {
  metricsFor(ownerWindow).adjacentPrewarmCompilations += 1;
}

function metricsFor(ownerWindow: Window): MutableKpReaderRuntimeMetrics {
  const existing = metricsByWindow.get(ownerWindow);
  if (existing !== undefined) return existing;
  const created = createMetrics();
  metricsByWindow.set(ownerWindow, created);
  return created;
}

function createMetrics(): MutableKpReaderRuntimeMetrics {
  return {
    scrollGeometryReads: 0,
    scrollAnchorReads: 0,
    canonicalSessionBuilds: 0,
    canonicalSessionBuildDurationMs: 0,
    canonicalSessionReuses: 0,
    canonicalSessionApplies: 0,
    purePlanCompilations: 0,
    purePlanCacheHits: 0,
    protectedTransitCompilations: 0,
    protectedTransitCertificateReuses: 0,
    adjacentPrewarmCompilations: 0
  };
}
