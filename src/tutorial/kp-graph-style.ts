export const kpGraphStrokeScaleMinimum = 0.65;
export const kpGraphStrokeScaleMaximum = 1.75;
export const kpGraphStrokeScaleStep = 0.05;
export const kpGraphStrokeScaleDefault = 1;

export function normalizeKpGraphStrokeScale(value: unknown): number {
  const numeric = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(numeric)) return kpGraphStrokeScaleDefault;
  const clamped = Math.max(
    kpGraphStrokeScaleMinimum,
    Math.min(kpGraphStrokeScaleMaximum, numeric)
  );
  return Number((
    Math.round(clamped / kpGraphStrokeScaleStep) * kpGraphStrokeScaleStep
  ).toFixed(2));
}

export function graphStrokeScaleSummary(scale: number): string {
  const normalized = normalizeKpGraphStrokeScale(scale);
  return `${normalized.toFixed(2)}× · dark ${normalized.toFixed(2)}px · ` +
    `light ${(normalized * 1.25).toFixed(2)}px`;
}

export function formatKpGraphStrokeScale(scale: number): string {
  return normalizeKpGraphStrokeScale(scale).toFixed(2);
}
