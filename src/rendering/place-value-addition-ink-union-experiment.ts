export const kpPlaceValueInkUnionExperimentKind =
  "source-derived-ink-union-v0" as const;

export interface KpPlaceValueInkUnionExperiment {
  readonly kind: typeof kpPlaceValueInkUnionExperimentKind;
  readonly apply: (progress: number) => void;
  readonly dispose: () => void;
}

let filterSequence = 0;

/**
 * A deliberately exemplar-local visual spike. It reshapes the compositor's
 * existing opaque glyph owners, so the organic bridge is derived from actual
 * measured ink without adding another semantic owner or renderer lifecycle.
 */
export function createKpPlaceValueInkUnionExperiment(input: {
  readonly document: Document;
  readonly sceneRoot: HTMLElement;
}): KpPlaceValueInkUnionExperiment {
  const materialLayer = input.sceneRoot.querySelector<HTMLElement>(
    "[data-kp-editor-equation-material-layer]"
  );
  if (materialLayer === null) {
    throw new Error("Ink-union experiment requires the canonical material layer.");
  }

  const svg = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  svg.dataset["kpPlaceValueInkUnionDefs"] = "";
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText =
    "position:absolute;inline-size:0;block-size:0;overflow:hidden;" +
    "pointer-events:none";
  const defs = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "defs"
  );
  const filter = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "filter"
  );
  const filterId = `kp-place-value-ink-union-${filterSequence++}`;
  filter.id = filterId;
  filter.setAttribute("x", "-60%");
  filter.setAttribute("y", "-120%");
  filter.setAttribute("width", "220%");
  filter.setAttribute("height", "340%");
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const dilate = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feMorphology"
  );
  dilate.setAttribute("in", "SourceGraphic");
  dilate.setAttribute("operator", "dilate");
  dilate.setAttribute("radius", "0");
  dilate.setAttribute("result", "expandedInk");

  const blur = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feGaussianBlur"
  );
  blur.setAttribute("in", "expandedInk");
  blur.setAttribute("stdDeviation", "0");
  blur.setAttribute("result", "pooledInk");

  const threshold = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feColorMatrix"
  );
  threshold.setAttribute("in", "pooledInk");
  threshold.setAttribute("type", "matrix");
  threshold.setAttribute("values", alphaThresholdMatrix(0));
  threshold.setAttribute("result", "inkUnion");
  filter.append(dilate, blur, threshold);
  defs.append(filter);
  svg.append(defs);
  input.sceneRoot.prepend(svg);

  input.sceneRoot.dataset["kpPlaceValueEvaluationVisualExperiment"] =
    kpPlaceValueInkUnionExperimentKind;
  input.sceneRoot.dataset["kpPlaceValueInkUnionState"] = "dormant";
  materialLayer.style.willChange = "filter";

  let disposed = false;
  const apply = (progress: number): void => {
    if (disposed) {
      throw new Error("Cannot apply a disposed ink-union experiment.");
    }
    const bounded = clamp01(progress);
    const strength = inkUnionStrength(bounded);
    input.sceneRoot.dataset["kpPlaceValueInkUnionStrengthPermille"] =
      String(Math.round(strength * 1_000));
    input.sceneRoot.dataset["kpPlaceValueInkUnionState"] =
      inkUnionState(bounded, strength);
    if (strength <= 0.001) {
      materialLayer.style.filter = "none";
      dilate.setAttribute("radius", "0");
      blur.setAttribute("stdDeviation", "0");
      threshold.setAttribute("values", alphaThresholdMatrix(0));
      return;
    }

    // Dilation preserves a result-sized material body while blur plus an
    // alpha threshold joins only nearby glyph contours into organic lobes.
    // All quantities return continuously to zero before native handoff.
    dilate.setAttribute("radius", (0.8 * strength).toFixed(3));
    blur.setAttribute("stdDeviation", (2.8 * strength).toFixed(3));
    threshold.setAttribute("values", alphaThresholdMatrix(strength));
    materialLayer.style.filter = `url(#${filterId})`;
  };

  return Object.freeze({
    kind: kpPlaceValueInkUnionExperimentKind,
    apply,
    dispose() {
      if (disposed) return;
      disposed = true;
      materialLayer.style.filter = "none";
      materialLayer.style.willChange = "auto";
      svg.remove();
      delete input.sceneRoot.dataset["kpPlaceValueEvaluationVisualExperiment"];
      delete input.sceneRoot.dataset["kpPlaceValueInkUnionState"];
      delete input.sceneRoot.dataset["kpPlaceValueInkUnionStrengthPermille"];
    }
  });
}

function inkUnionStrength(progress: number): number {
  const gathering = smoothstep(0.36, 0.6, progress);
  const resolving = 1 - smoothstep(0.82, 0.97, progress);
  return gathering * resolving;
}

function inkUnionState(
  progress: number,
  strength: number
): "dormant" | "forming" | "pooled" | "resolving" {
  if (strength <= 0.001) return "dormant";
  if (progress < 0.6) return "forming";
  if (progress < 0.82) return "pooled";
  return "resolving";
}

function alphaThresholdMatrix(strength: number): string {
  const alphaScale = 1 + 17 * strength;
  const alphaOffset = -7 * strength;
  return [
    "1 0 0 0 0",
    "0 1 0 0 0",
    "0 0 1 0 0",
    `0 0 0 ${alphaScale.toFixed(3)} ${alphaOffset.toFixed(3)}`
  ].join(" ");
}

function smoothstep(start: number, end: number, value: number): number {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Ink-union progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
