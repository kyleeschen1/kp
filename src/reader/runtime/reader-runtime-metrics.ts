export interface KpReaderRuntimeMetricsSnapshot {
  readonly scrollGeometryReads: number;
  readonly scrollAnchorReads: number;
  readonly canonicalSessionBuilds: number;
  readonly canonicalSessionBuildDurationMs: number;
  readonly canonicalSessionReuses: number;
  readonly canonicalSessionApplies: number;
}

interface MutableKpReaderRuntimeMetrics {
  scrollGeometryReads: number;
  scrollAnchorReads: number;
  canonicalSessionBuilds: number;
  canonicalSessionBuildDurationMs: number;
  canonicalSessionReuses: number;
  canonicalSessionApplies: number;
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
    canonicalSessionApplies: 0
  };
}
