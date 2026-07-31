export const kpPlaceValueInkUnionExperimentKind =
  "source-derived-ink-union-v0" as const;

export interface KpPlaceValueInkUnionExperiment {
  readonly kind: typeof kpPlaceValueInkUnionExperimentKind;
  readonly apply: (progress: number) => void;
  readonly dispose: () => void;
}

interface KpInkUnionArcOwnership {
  readonly contributionProxies: readonly {
    readonly bindingAnnotationId: string;
    readonly documentaryClearanceSide: "above" | "below";
  }[];
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

  const blur = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "feGaussianBlur"
  );
  blur.setAttribute("in", "SourceGraphic");
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
  filter.append(blur, threshold);
  defs.append(filter);
  svg.append(defs);
  input.sceneRoot.prepend(svg);

  input.sceneRoot.dataset["kpPlaceValueEvaluationVisualExperiment"] =
    kpPlaceValueInkUnionExperimentKind;
  input.sceneRoot.dataset["kpPlaceValueInkUnionState"] = "dormant";
  // Keep the filter pipeline installed from the first material-owned frame.
  // Switching between `none` and a URL mid-motion rasterized the glyphs as a
  // new surface and made an otherwise continuous approach look like a jump.
  materialLayer.style.filter = `url(#${filterId})`;
  materialLayer.style.transform = "scale(1)";
  materialLayer.style.willChange = "filter, transform";

  let disposed = false;
  let seedOriginPrepared = false;
  const apply = (progress: number): void => {
    if (disposed) {
      throw new Error("Cannot apply a disposed ink-union experiment.");
    }
    const bounded = clamp01(progress);
    if (!seedOriginPrepared) {
      prepareSeedOrigin(input.sceneRoot, materialLayer);
      seedOriginPrepared = true;
    }
    const strength = inkUnionStrength(bounded);
    const scale = pinchAndBloomScale(bounded);
    input.sceneRoot.dataset["kpPlaceValueInkUnionStrengthPermille"] =
      String(Math.round(strength * 1_000));
    input.sceneRoot.dataset["kpPlaceValueInkUnionScalePermille"] =
      String(Math.round(scale * 1_000));
    input.sceneRoot.dataset["kpPlaceValueInkUnionState"] =
      inkUnionState(bounded, strength, scale);

    // Geometry brings the glyphs into contact; the much narrower filter only
    // rounds their seam. This keeps the bridge calligraphic instead of using
    // dilation to manufacture a thick body between distant paint.
    blur.setAttribute("stdDeviation", (1.15 * strength).toFixed(3));
    threshold.setAttribute("values", alphaThresholdMatrix(strength));
    materialLayer.style.transform = `scale(${scale.toFixed(4)})`;
  };

  return Object.freeze({
    kind: kpPlaceValueInkUnionExperimentKind,
    apply,
    dispose() {
      if (disposed) return;
      disposed = true;
      materialLayer.style.filter = "none";
      materialLayer.style.transform = "none";
      materialLayer.style.transformOrigin = "";
      materialLayer.style.willChange = "auto";
      svg.remove();
      delete input.sceneRoot.dataset["kpPlaceValueEvaluationVisualExperiment"];
      delete input.sceneRoot.dataset["kpPlaceValueInkUnionState"];
      delete input.sceneRoot.dataset["kpPlaceValueInkUnionStrengthPermille"];
      delete input.sceneRoot.dataset["kpPlaceValueInkUnionScalePermille"];
    }
  });
}

function inkUnionStrength(progress: number): number {
  const gathering = smoothstep(0.64, 0.76, progress);
  const resolving = 1 - smoothstep(0.84, 0.95, progress);
  return gathering * resolving;
}

function pinchAndBloomScale(progress: number): number {
  const minimumScale = 0.48;
  const seedProgress = 0.76;
  if (progress <= seedProgress) {
    return 1 - (1 - minimumScale) * smoothstep(
      0.66,
      seedProgress,
      progress
    );
  }
  return minimumScale + (1 - minimumScale) * smoothstep(
    seedProgress,
    0.96,
    progress
  );
}

function inkUnionState(
  progress: number,
  strength: number,
  scale: number
):
  | "dormant"
  | "docking"
  | "pinching"
  | "seed"
  | "blooming"
  | "resolved" {
  if (progress >= 0.96) return "resolved";
  if (progress < 0.58) return "dormant";
  if (strength <= 0.001) return "docking";
  if (progress < 0.74) return "pinching";
  if (scale <= 0.5) return "seed";
  return "blooming";
}

/**
 * The normal workspace guard resolves unexpected paint collisions after
 * sampling. That thresholded correction is correct as a fallback but reads as
 * a jump in an authored exemplar. Here each contributor receives one bounded
 * C1 arc whose endpoints coincide exactly with the compositor route.
 */
export function applyKpPlaceValueInkUnionContributorArcs(input: {
  readonly overlay: HTMLElement;
  readonly ownership: KpInkUnionArcOwnership;
}): boolean {
  if (
    input.overlay.dataset["kpPlaceValueEvaluationVisualExperiment"] !==
      kpPlaceValueInkUnionExperimentKind
  ) {
    return false;
  }
  const progress = clamp01(Number(
    input.overlay.dataset["kpOperationEvaluationProgress"]
  ));
  const owners = [
    ...input.overlay.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )
  ];
  input.ownership.contributionProxies.forEach((proxy, index) => {
    const owner = owners.find((candidate) =>
      candidate.dataset["kpEquationMaterialSemanticEntityId"] ===
        proxy.bindingAnnotationId
    );
    if (owner === undefined || getComputedStyle(owner).opacity === "0") {
      return;
    }
    const start = 0.16 + index * 0.08;
    const end = 0.58 + index * 0.08;
    const routeProgress = clamp01((progress - start) / (end - start));
    const arcProgress = smoothstep(0, 1, routeProgress);
    const arc = Math.sin(Math.PI * arcProgress);
    const visual = owner.firstElementChild;
    const cachedHeight = Number(
      owner.dataset["kpPlaceValueInkArcHeightPx"]
    );
    const paintHeight = Number.isFinite(cachedHeight) && cachedHeight > 0
      ? cachedHeight
      : visual instanceof HTMLElement
        ? visual.getBoundingClientRect().height
        : 0;
    if (!(Number.isFinite(cachedHeight) && cachedHeight > 0)) {
      owner.dataset["kpPlaceValueInkArcHeightPx"] = String(paintHeight);
    }
    const direction = proxy.documentaryClearanceSide === "above" ? -1 : 1;
    const offset = direction * (paintHeight * 0.45 + 3) * arc;
    owner.style.translate = `0 ${offset.toFixed(3)}px`;
    owner.dataset["kpPlaceValueInkArcOffsetPx"] = offset.toFixed(3);
  });
  return true;
}

function alphaThresholdMatrix(strength: number): string {
  const alphaScale = 1 + 7 * strength;
  const alphaOffset = -2.5 * strength;
  return [
    "1 0 0 0 0",
    "0 1 0 0 0",
    "0 0 1 0 0",
    `0 0 0 ${alphaScale.toFixed(3)} ${alphaOffset.toFixed(3)}`
  ].join(" ");
}

function prepareSeedOrigin(
  sceneRoot: HTMLElement,
  materialLayer: HTMLElement
): void {
  const targets = [
    ...sceneRoot.querySelectorAll<HTMLElement>(
      '[data-kp-place-value-operation-endpoint="target"] ' +
      "[data-kp-place-value-motion-target-id]"
    )
  ].map((target) => target.getBoundingClientRect())
    .filter(({ width, height }) => width > 0 && height > 0);
  if (targets.length === 0) {
    throw new Error("Ink-union experiment requires measurable result paint.");
  }
  const layer = materialLayer.getBoundingClientRect();
  const left = Math.min(...targets.map((target) => target.left));
  const top = Math.min(...targets.map((target) => target.top));
  const right = Math.max(...targets.map((target) => target.right));
  const bottom = Math.max(...targets.map((target) => target.bottom));
  materialLayer.style.transformOrigin =
    `${((left + right) / 2 - layer.left).toFixed(3)}px ` +
    `${((top + bottom) / 2 - layer.top).toFixed(3)}px`;
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
