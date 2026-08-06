import {
  formatKpGraphStrokeScale,
  kpGraphStrokeScaleDefault,
  normalizeKpGraphStrokeScale
} from "../kp-graph-style.ts";

const strokeScaleQueryKey = "stroke";

export interface KpEconomicsGraphStrokeWidths {
  readonly theme: "dark" | "light";
  readonly axisPx: number;
  readonly curvePx: number;
  readonly gridPx: number;
  readonly guidePx: number;
  readonly intersectionPx: number;
  readonly traceCasingPx: number;
  readonly traceCorePx: number;
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

export function projectKpEconomicsGraphStrokeWidths(input: {
  readonly scale: number;
  readonly theme: "dark" | "light";
}
): KpEconomicsGraphStrokeWidths {
  const normalized = normalizeKpGraphStrokeScale(input.scale);
  const axisPx = Number((
    normalized * (input.theme === "light" ? 1.25 : 1)
  ).toFixed(4));
  return Object.freeze({
    theme: input.theme,
    axisPx,
    curvePx: axisPx,
    gridPx: axisPx,
    guidePx: axisPx,
    intersectionPx: axisPx,
    traceCasingPx: axisPx,
    traceCorePx: Number((axisPx * 0.5).toFixed(4))
  });
}

export function serializeKpEconomicsGraphStrokeWidths(
  widths: KpEconomicsGraphStrokeWidths
): string {
  return [
    ["axis", widths.axisPx],
    ["curve", widths.curvePx],
    ["grid", widths.gridPx],
    ["guide", widths.guidePx],
    ["intersection", widths.intersectionPx],
    ["trace-casing", widths.traceCasingPx],
    ["trace-core", widths.traceCorePx]
  ].map(([role, width]) =>
    `--kp-graph-tuned-stroke-${role}:${width}px`
  ).join(";");
}
