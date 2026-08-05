import {
  formatKpGraphStrokeScale,
  kpGraphStrokeScaleDefault,
  normalizeKpGraphStrokeScale
} from "../kp-graph-style.ts";

const strokeScaleQueryKey = "stroke";

export interface KpEconomicsGraphStrokeWidths {
  readonly darkPx: number;
  readonly darkGhostCorePx: number;
  readonly lightPx: number;
  readonly lightGhostCorePx: number;
}

export function readKpEconomicsGraphStrokeScale(search: string): number {
  const value = new URLSearchParams(search).get(strokeScaleQueryKey);
  return normalizeKpGraphStrokeScale(value);
}

export function writeKpEconomicsGraphStrokeScale(input: {
  readonly search: string;
  readonly scale: number;
}): string {
  const parameters = new URLSearchParams(input.search);
  const scale = normalizeKpGraphStrokeScale(input.scale);
  if (scale === kpGraphStrokeScaleDefault) {
    parameters.delete(strokeScaleQueryKey);
  } else {
    parameters.set(strokeScaleQueryKey, formatKpGraphStrokeScale(scale));
  }
  const serialized = parameters.toString();
  return serialized === "" ? "" : `?${serialized}`;
}

export function projectKpEconomicsGraphStrokeWidths(
  scale: number
): KpEconomicsGraphStrokeWidths {
  const normalized = normalizeKpGraphStrokeScale(scale);
  return Object.freeze({
    darkPx: normalized,
    darkGhostCorePx: Number((normalized * 0.5).toFixed(4)),
    lightPx: Number((normalized * 1.25).toFixed(4)),
    lightGhostCorePx: Number((normalized * 1.25 * 0.5).toFixed(4))
  });
}
