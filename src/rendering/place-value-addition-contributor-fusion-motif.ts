import type {
  KpPlaceValueWrittenOwnershipPlan
} from "./place-value-addition-written-ownership.ts";

export const kpPlaceValueContributorFusionMotifKind =
  "source-derived-contributor-fusion-v1" as const;
export const kpPlaceValueStandardEvaluationMotifKind =
  "standard-successor-synthesis-v1" as const;

declare const kpPlaceValueContributorFusionPlanBrand: unique symbol;

const sealedPlans = new WeakSet<object>();

export interface KpPlaceValueContributorArcPlan {
  readonly bindingAnnotationId: string;
  readonly clearanceSide: "above" | "below";
  readonly lateralBias: "toward-lower-position" | "none";
  readonly startProgress: number;
  readonly endProgress: number;
}

export interface KpPlaceValueContributorFusionPlan {
  readonly schemaVersion: "kp.place-value-contributor-fusion.v1";
  readonly kind: typeof kpPlaceValueContributorFusionMotifKind;
  readonly ownershipPolicy: "opaque-lineage-with-canonical-handoffs";
  readonly routePolicy: "staggered-c1-arcs";
  readonly bodyPolicy: "source-derived-thin-ink-union";
  readonly contributorArcs: readonly KpPlaceValueContributorArcPlan[];
  readonly dockProgress: number;
  readonly seedProgress: number;
  readonly resolveProgress: number;
  readonly [kpPlaceValueContributorFusionPlanBrand]: true;
}

export interface KpPlaceValueContributorFusionRenderer {
  readonly kind: typeof kpPlaceValueContributorFusionMotifKind;
  readonly apply: (progress: number) => void;
  readonly dispose: () => void;
}

export type KpPlaceValueEvaluationVisualMotif =
  | {
      readonly kind: typeof kpPlaceValueStandardEvaluationMotifKind;
    }
  | {
      readonly kind: typeof kpPlaceValueContributorFusionMotifKind;
      readonly plan: KpPlaceValueContributorFusionPlan;
    };

export const kpPlaceValueStandardEvaluationMotif = Object.freeze({
  kind: kpPlaceValueStandardEvaluationMotifKind
}) satisfies KpPlaceValueEvaluationVisualMotif;

let filterSequence = 0;

/**
 * Compiles the approved motion language from typed paint ownership. Keeping
 * schedule derivation here prevents a three-contributor caller from pinching
 * on the two-contributor exemplar's clock before its final arc has docked.
 */
export function compileKpPlaceValueContributorFusionPlan(
  ownership: KpPlaceValueWrittenOwnershipPlan
): KpPlaceValueContributorFusionPlan {
  if (ownership.contributionProxies.length < 2) {
    throw new Error("Contributor fusion requires at least two material inputs.");
  }
  const contributorArcs = ownership.contributionProxies.map(
    (proxy, index) => Object.freeze({
      bindingAnnotationId: proxy.bindingAnnotationId,
      clearanceSide: proxy.documentaryClearanceSide,
      lateralBias: proxy.contributorKind === "incoming-carry"
        ? "toward-lower-position" as const
        : "none" as const,
      startProgress: 0.16 + index * 0.08,
      endProgress: 0.58 + index * 0.08
    })
  );
  const dockProgress = contributorArcs.at(-1)!.endProgress;
  const seedProgress = Math.min(0.84, dockProgress + 0.1);
  const resolveProgress = Math.min(
    0.98,
    0.96 + Math.max(0, contributorArcs.length - 2) * 0.02
  );
  const plan = Object.freeze({
    schemaVersion: "kp.place-value-contributor-fusion.v1" as const,
    kind: kpPlaceValueContributorFusionMotifKind,
    ownershipPolicy: "opaque-lineage-with-canonical-handoffs" as const,
    routePolicy: "staggered-c1-arcs" as const,
    bodyPolicy: "source-derived-thin-ink-union" as const,
    contributorArcs: Object.freeze(contributorArcs),
    dockProgress,
    seedProgress,
    resolveProgress
  });
  sealedPlans.add(plan);
  return plan as KpPlaceValueContributorFusionPlan;
}

export function compileKpPlaceValueContributorFusionMotif(
  ownership: KpPlaceValueWrittenOwnershipPlan
): KpPlaceValueEvaluationVisualMotif & {
  readonly kind: typeof kpPlaceValueContributorFusionMotifKind;
} {
  return Object.freeze({
    kind: kpPlaceValueContributorFusionMotifKind,
    plan: compileKpPlaceValueContributorFusionPlan(ownership)
  });
}

export function isKpPlaceValueContributorFusionPlan(
  value: unknown
): value is KpPlaceValueContributorFusionPlan {
  return typeof value === "object" && value !== null && sealedPlans.has(value);
}

export function sampleKpPlaceValueContributorArc(
  arc: KpPlaceValueContributorArcPlan,
  progress: number
): number {
  const routeProgress = clamp01(
    (clamp01(progress) - arc.startProgress) /
      (arc.endProgress - arc.startProgress)
  );
  // Smoothstep makes both ends stationary; the sine supplies the natural
  // rise and return without introducing another piecewise route boundary.
  return Math.sin(Math.PI * smoothstep(0, 1, routeProgress));
}

/**
 * Reshapes the compositor's existing opaque glyph owners. The organic bridge
 * is derived from measured ink, so this motif adds no semantic owner, clock,
 * renderer session, or non-native endpoint.
 */
export function createKpPlaceValueContributorFusionRenderer(input: {
  readonly document: Document;
  readonly sceneRoot: HTMLElement;
  readonly plan: KpPlaceValueContributorFusionPlan;
}): KpPlaceValueContributorFusionRenderer {
  if (!isKpPlaceValueContributorFusionPlan(input.plan)) {
    throw new Error("Contributor-fusion renderer requires a compiled plan.");
  }
  const materialLayer = input.sceneRoot.querySelector<HTMLElement>(
    "[data-kp-editor-equation-material-layer]"
  );
  if (materialLayer === null) {
    throw new Error("Contributor fusion requires the canonical material layer.");
  }

  const svg = input.document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  svg.dataset["kpPlaceValueContributorFusionDefs"] = "";
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
  const filterId = `kp-place-value-contributor-fusion-${filterSequence++}`;
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

  input.sceneRoot.dataset["kpPlaceValueEvaluationVisualMotif"] =
    kpPlaceValueContributorFusionMotifKind;
  input.sceneRoot.dataset["kpPlaceValueContributorFusionState"] = "dormant";
  // Keep the filter pipeline installed from the first material-owned frame.
  // Switching between `none` and a URL mid-motion rasterizes the glyphs as a
  // new surface and makes an otherwise continuous approach look like a jump.
  materialLayer.style.filter = `url(#${filterId})`;
  materialLayer.style.transform = "scale(1)";
  materialLayer.style.willChange = "filter, transform";

  let disposed = false;
  let seedOriginPrepared = false;
  const apply = (progress: number): void => {
    if (disposed) {
      throw new Error("Cannot apply a disposed contributor-fusion renderer.");
    }
    const bounded = clamp01(progress);
    if (!seedOriginPrepared) {
      prepareSeedOrigin(input.sceneRoot, materialLayer);
      seedOriginPrepared = true;
    }
    const strength = inkUnionStrength(input.plan, bounded);
    const scale = pinchAndBloomScale(input.plan, bounded);
    input.sceneRoot.dataset["kpPlaceValueContributorFusionStrengthPermille"] =
      String(Math.round(strength * 1_000));
    input.sceneRoot.dataset["kpPlaceValueContributorFusionScalePermille"] =
      String(Math.round(scale * 1_000));
    input.sceneRoot.dataset["kpPlaceValueContributorFusionState"] =
      contributorFusionState(input.plan, bounded, strength, scale);

    // Geometry brings the glyphs into contact; the narrow filter only rounds
    // their seam. Dilation would manufacture a thick body between distant ink.
    blur.setAttribute("stdDeviation", (1.15 * strength).toFixed(3));
    threshold.setAttribute("values", alphaThresholdMatrix(strength));
    materialLayer.style.transform = `scale(${scale.toFixed(4)})`;
  };

  return Object.freeze({
    kind: kpPlaceValueContributorFusionMotifKind,
    apply,
    dispose() {
      if (disposed) return;
      disposed = true;
      materialLayer.style.filter = "none";
      materialLayer.style.transform = "none";
      materialLayer.style.transformOrigin = "";
      materialLayer.style.willChange = "auto";
      svg.remove();
      delete input.sceneRoot.dataset["kpPlaceValueEvaluationVisualMotif"];
      delete input.sceneRoot.dataset["kpPlaceValueContributorFusionState"];
      delete input.sceneRoot.dataset[
        "kpPlaceValueContributorFusionStrengthPermille"
      ];
      delete input.sceneRoot.dataset[
        "kpPlaceValueContributorFusionScalePermille"
      ];
    }
  });
}

/**
 * Applies the authored arcs instead of the generic post-paint collision guard.
 * The guard is a thresholded emergency correction; mixing it into this motif
 * would reintroduce the discontinuity that the typed route exists to prevent.
 */
export function applyKpPlaceValueContributorFusionArcs(input: {
  readonly overlay: HTMLElement;
  readonly plan: KpPlaceValueContributorFusionPlan;
}): boolean {
  if (
    input.overlay.dataset["kpPlaceValueEvaluationVisualMotif"] !==
      kpPlaceValueContributorFusionMotifKind
  ) {
    return false;
  }
  if (!isKpPlaceValueContributorFusionPlan(input.plan)) {
    throw new Error("Contributor arcs require a compiled fusion plan.");
  }
  const progress = clamp01(Number(
    input.overlay.dataset["kpOperationEvaluationProgress"]
  ));
  const owners = [
    ...input.overlay.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )
  ];
  for (const arcPlan of input.plan.contributorArcs) {
    const owner = owners.find((candidate) =>
      candidate.dataset["kpEquationMaterialSemanticEntityId"] ===
        arcPlan.bindingAnnotationId
    );
    if (owner === undefined) {
      continue;
    }
    const arc = sampleKpPlaceValueContributorArc(arcPlan, progress);
    if (getComputedStyle(owner).opacity === "0") {
      // The native source owns the exact endpoint before the compositor's
      // atomic handoff. Initializing the authored route to zero keeps direct
      // seek telemetry complete without caching an unpainted height.
      owner.style.translate = "0 0px";
      owner.dataset["kpPlaceValueContributorArcOffsetPx"] = "0.000";
      owner.dataset["kpPlaceValueContributorArcLateralOffsetPx"] = "0.000";
      continue;
    }
    const visual = owner.firstElementChild;
    const cachedHeight = Number(
      owner.dataset["kpPlaceValueContributorArcHeightPx"]
    );
    const paintHeight = Number.isFinite(cachedHeight) && cachedHeight > 0
      ? cachedHeight
      : visual instanceof HTMLElement
        ? visual.getBoundingClientRect().height
        : 0;
    if (!(Number.isFinite(cachedHeight) && cachedHeight > 0)) {
      owner.dataset["kpPlaceValueContributorArcHeightPx"] = String(paintHeight);
    }
    const direction = arcPlan.clearanceSide === "above" ? -1 : 1;
    const offset = direction * (paintHeight * 0.45 + 3) * arc;
    // Incoming carry starts beside the next-higher position. A small inward
    // bow keeps it out of that neighboring documentary column while retaining
    // the same stationary-endpoint fusion route.
    const lateralOffset = arcPlan.lateralBias === "toward-lower-position"
      ? (paintHeight * 0.22 + 3.2) * arc
      : 0;
    owner.style.translate =
      `${lateralOffset.toFixed(3)}px ${offset.toFixed(3)}px`;
    owner.dataset["kpPlaceValueContributorArcOffsetPx"] = offset.toFixed(3);
    owner.dataset["kpPlaceValueContributorArcLateralOffsetPx"] =
      lateralOffset.toFixed(3);
  }
  return true;
}

function inkUnionStrength(
  plan: KpPlaceValueContributorFusionPlan,
  progress: number
): number {
  const gathering = smoothstep(
    plan.dockProgress - 0.02,
    plan.seedProgress,
    progress
  );
  const resolveStart = Math.min(
    plan.resolveProgress - 0.04,
    plan.seedProgress + 0.08
  );
  const resolving = 1 - smoothstep(
    resolveStart,
    plan.resolveProgress - 0.01,
    progress
  );
  return gathering * resolving;
}

function pinchAndBloomScale(
  plan: KpPlaceValueContributorFusionPlan,
  progress: number
): number {
  const minimumScale = 0.48;
  if (progress <= plan.seedProgress) {
    return 1 - (1 - minimumScale) * smoothstep(
      plan.dockProgress,
      plan.seedProgress,
      progress
    );
  }
  return minimumScale + (1 - minimumScale) * smoothstep(
    plan.seedProgress,
    plan.resolveProgress,
    progress
  );
}

function contributorFusionState(
  plan: KpPlaceValueContributorFusionPlan,
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
  if (progress >= plan.resolveProgress) return "resolved";
  if (progress < plan.contributorArcs[0]!.endProgress) return "dormant";
  if (progress < plan.dockProgress || strength <= 0.001) return "docking";
  if (progress < plan.seedProgress - 0.02) return "pinching";
  if (scale <= 0.5) return "seed";
  return "blooming";
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
    throw new Error("Contributor fusion requires measurable result paint.");
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
    throw new Error("Contributor-fusion progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
