import type {
  KpMotionFieldPathFamily,
  KpMotionFieldPlan
} from "./motion-field.ts";

export interface KpOrganicPathPoint {
  readonly x: number;
  readonly y: number;
}

export interface KpOrganicPathRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export type KpOrganicPathVariant =
  | "direct"
  | "arc-above"
  | "arc-below"
  | "diagonal-arc-above"
  | "diagonal-arc-below"
  | "opposite-corner";

export interface KpOrganicPathReadingContext {
  readonly direction: "left-to-right" | "right-to-left";
  readonly baselineY: number;
}

export interface KpOrganicPathCanonicalRequirement {
  readonly motifId: string;
  readonly requiredPathFamily: KpMotionFieldPathFamily;
  readonly requireOppositeCornerReconciliation?: boolean | undefined;
}

export type KpOrganicPathGeometry =
  | {
      readonly kind: "quadratic";
      readonly start: KpOrganicPathPoint;
      readonly control: KpOrganicPathPoint;
      readonly end: KpOrganicPathPoint;
    }
  | {
      readonly kind: "opposite-corner-reconciliation";
      readonly start: KpOrganicPathPoint;
      readonly departureControl: KpOrganicPathPoint;
      readonly reconciliation: KpOrganicPathPoint;
      readonly arrivalControl: KpOrganicPathPoint;
      readonly end: KpOrganicPathPoint;
      readonly reconciliationProgress: number;
    };

export interface KpOrganicPathCandidate {
  readonly id: string;
  readonly variant: KpOrganicPathVariant;
  readonly pathFamily: KpMotionFieldPathFamily;
  readonly geometry: KpOrganicPathGeometry;
  readonly collisionCount: number;
  readonly travelDistance: number;
  readonly canonicalMotifPenalty: number;
  readonly motionFieldPenalty: number;
  readonly readingContextPenalty: number;
  readonly score: number;
  readonly safe: boolean;
  readonly canonicalConformant: boolean;
}

export interface KpOrganicPathPlan {
  readonly id: string;
  readonly kind: "kp-organic-path-plan";
  readonly motionFieldId: string;
  readonly selected: KpOrganicPathCandidate;
  readonly candidates: readonly KpOrganicPathCandidate[];
  readonly promotable: boolean;
  readonly diagnostics: readonly string[];
  readonly sampleCount: number;
}

export interface KpOrganicPathPlanInput {
  readonly id: string;
  readonly motionField: KpMotionFieldPlan;
  readonly sourceAnchor: KpOrganicPathPoint;
  readonly targetAnchor: KpOrganicPathPoint;
  readonly targetBounds: KpOrganicPathRect;
  readonly reconciliationAnchor?: KpOrganicPathPoint | undefined;
  readonly obstacles?: readonly KpOrganicPathRect[] | undefined;
  readonly moverRadius?: number | undefined;
  readonly clearance?: number | undefined;
  readonly sampleCount?: number | undefined;
  readonly readingContext: KpOrganicPathReadingContext;
  readonly canonicalRequirement?: KpOrganicPathCanonicalRequirement | undefined;
}

export function planKpOrganicPath(
  input: KpOrganicPathPlanInput
): KpOrganicPathPlan {
  rejectAuthoredRouting(input);
  validatePoint(input.sourceAnchor, "sourceAnchor");
  validatePoint(input.targetAnchor, "targetAnchor");
  if (input.reconciliationAnchor !== undefined) {
    validatePoint(input.reconciliationAnchor, "reconciliationAnchor");
  }
  validateRect(input.targetBounds, "targetBounds");
  input.obstacles?.forEach((obstacle, index) =>
    validateRect(obstacle, `obstacles[${index}]`)
  );
  const sampleCount = positiveInteger(input.sampleCount ?? 32, "sampleCount");
  const moverRadius = nonNegative(input.moverRadius ?? 2, "moverRadius");
  const clearance = nonNegative(
    input.clearance ??
      Math.max(14, distance(input.sourceAnchor, input.targetAnchor) * 0.18),
    "clearance"
  );
  const variants = variantsForField(input.motionField);
  const candidates = variants.map((variant, index) =>
    createCandidate(input, variant, index, clearance, moverRadius, sampleCount)
  );
  const ranked = [...candidates].sort(
    (left, right) =>
      Number(right.canonicalConformant) -
        Number(left.canonicalConformant) ||
      left.collisionCount - right.collisionCount ||
      left.score - right.score ||
      variantOrder(left.variant) - variantOrder(right.variant) ||
      left.id.localeCompare(right.id)
  );
  const selected = ranked[0]!;
  const diagnostics: string[] = [];
  if (!selected.safe) {
    diagnostics.push(
      `Selected path ${selected.id} intersects measured obstacles.`
    );
  }
  if (!selected.canonicalConformant) {
    diagnostics.push(
      `Selected path ${selected.id} does not satisfy the canonical motif requirement.`
    );
  }
  return {
    id: input.id,
    kind: "kp-organic-path-plan",
    motionFieldId: input.motionField.id,
    selected,
    candidates: ranked,
    promotable: selected.safe && selected.canonicalConformant,
    diagnostics,
    sampleCount
  };
}

export function sampleKpOrganicPath(
  candidate: Pick<KpOrganicPathCandidate, "geometry">,
  progress: number
): KpOrganicPathPoint {
  const p = clamp01(progress);
  const geometry = candidate.geometry;
  if (geometry.kind === "quadratic") {
    return sampleQuadratic(
      geometry.start,
      geometry.control,
      geometry.end,
      p
    );
  }
  if (p <= geometry.reconciliationProgress) {
    return sampleQuadratic(
      geometry.start,
      geometry.departureControl,
      geometry.reconciliation,
      p / geometry.reconciliationProgress
    );
  }
  return sampleQuadratic(
    geometry.reconciliation,
    geometry.arrivalControl,
    geometry.end,
    (p - geometry.reconciliationProgress) /
      (1 - geometry.reconciliationProgress)
  );
}

function createCandidate(
  input: KpOrganicPathPlanInput,
  variant: KpOrganicPathVariant,
  index: number,
  clearance: number,
  moverRadius: number,
  sampleCount: number
): KpOrganicPathCandidate {
  const pathFamily = familyForVariant(variant, input.motionField);
  const geometry = geometryForVariant(input, variant, clearance);
  const points = Array.from({ length: sampleCount + 1 }, (_value, sampleIndex) =>
    sampleKpOrganicPath({ geometry }, sampleIndex / sampleCount)
  );
  const collisionCount = collisionSampleCount(
    points,
    input.obstacles ?? [],
    moverRadius
  );
  const canonicalConformant = conformsToCanonicalRequirement(
    variant,
    pathFamily,
    input.canonicalRequirement
  );
  const canonicalMotifPenalty = canonicalConformant ? 0 : 1_000_000;
  const motionFieldPenalty =
    pathFamily === input.motionField.curvatureFamily ? 0 : 240;
  const readingContextPenalty = readingPenalty(
    variant,
    input.sourceAnchor,
    input.targetAnchor,
    input.readingContext
  );
  const travelDistance = polylineDistance(points);
  return {
    id: `${input.id}.${variant}`,
    variant,
    pathFamily,
    geometry,
    collisionCount,
    travelDistance: round(travelDistance),
    canonicalMotifPenalty,
    motionFieldPenalty,
    readingContextPenalty,
    // Canonical mismatch and collision are hard tiers; context and travel rank safe peers.
    score: round(
      canonicalMotifPenalty +
        collisionCount * 10_000 +
        motionFieldPenalty +
        readingContextPenalty * 20 +
        travelDistance * 0.01 +
        index * 0.000_001
    ),
    safe: collisionCount === 0,
    canonicalConformant
  };
}

function variantsForField(
  field: KpMotionFieldPlan
): readonly KpOrganicPathVariant[] {
  switch (field.curvatureFamily) {
    case "shortest-curvature":
      return ["direct", "arc-above", "arc-below"];
    case "diagonal-arc":
      return [
        "diagonal-arc-above",
        "diagonal-arc-below",
        "arc-above",
        "arc-below",
        "direct"
      ];
    case "opposite-corner":
      return [
        "opposite-corner",
        "diagonal-arc-above",
        "diagonal-arc-below",
        "arc-above",
        "arc-below",
        "direct"
      ];
    case "mirrored-branch-arcs":
      return ["arc-above", "arc-below"];
  }
}

function geometryForVariant(
  input: KpOrganicPathPlanInput,
  variant: KpOrganicPathVariant,
  clearance: number
): KpOrganicPathGeometry {
  const start = { ...input.sourceAnchor };
  const end = { ...input.targetAnchor };
  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
  switch (variant) {
    case "direct":
      return { kind: "quadratic", start, control: midpoint, end };
    case "arc-above":
      return {
        kind: "quadratic",
        start,
        control: {
          x: midpoint.x,
          y: Math.min(start.y, end.y, input.readingContext.baselineY) - clearance
        },
        end
      };
    case "arc-below":
      return {
        kind: "quadratic",
        start,
        control: {
          x: midpoint.x,
          y: Math.max(start.y, end.y, input.readingContext.baselineY) + clearance
        },
        end
      };
    case "diagonal-arc-above":
      return {
        kind: "quadratic",
        start,
        control: {
          x: start.x + (end.x - start.x) * 0.68,
          y: Math.min(start.y, end.y) - clearance * 0.72
        },
        end
      };
    case "diagonal-arc-below":
      return {
        kind: "quadratic",
        start,
        control: {
          x: start.x + (end.x - start.x) * 0.32,
          y: Math.max(start.y, end.y) + clearance * 0.72
        },
        end
      };
    case "opposite-corner": {
      const reconciliation = input.reconciliationAnchor ??
        oppositeTargetCorner(input.targetBounds, input.sourceAnchor);
      return {
        kind: "opposite-corner-reconciliation",
        start,
        departureControl: {
          x: start.x + (reconciliation.x - start.x) * 0.58,
          y:
            Math.min(start.y, reconciliation.y) -
            clearance * 0.42
        },
        reconciliation,
        arrivalControl: {
          x: reconciliation.x + (end.x - reconciliation.x) * 0.3,
          y: reconciliation.y + (end.y - reconciliation.y) * 0.72
        },
        end,
        reconciliationProgress: 0.78
      };
    }
  }
}

function oppositeTargetCorner(
  bounds: KpOrganicPathRect,
  source: KpOrganicPathPoint
): KpOrganicPathPoint {
  const center = {
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2
  };
  return {
    x: source.x >= center.x ? bounds.left : bounds.left + bounds.width,
    y: source.y <= center.y ? bounds.top + bounds.height : bounds.top
  };
}

function conformsToCanonicalRequirement(
  variant: KpOrganicPathVariant,
  family: KpMotionFieldPathFamily,
  requirement: KpOrganicPathCanonicalRequirement | undefined
): boolean {
  if (requirement === undefined) return true;
  if (family !== requirement.requiredPathFamily) return false;
  return requirement.requireOppositeCornerReconciliation !== true ||
    variant === "opposite-corner";
}

function readingPenalty(
  variant: KpOrganicPathVariant,
  start: KpOrganicPathPoint,
  end: KpOrganicPathPoint,
  context: KpOrganicPathReadingContext
): number {
  if (variant === "direct" || variant === "opposite-corner") return 0;
  const movesWithReading =
    context.direction === "left-to-right"
      ? end.x >= start.x
      : end.x <= start.x;
  const above = variant.endsWith("above");
  return above === movesWithReading ? 0 : 1;
}

function familyForVariant(
  variant: KpOrganicPathVariant,
  field: KpMotionFieldPlan
): KpMotionFieldPathFamily {
  if (variant === "direct") return "shortest-curvature";
  if (variant === "opposite-corner") return "opposite-corner";
  if (variant.startsWith("diagonal")) return "diagonal-arc";
  return field.curvatureFamily === "mirrored-branch-arcs"
    ? "mirrored-branch-arcs"
    : "shortest-curvature";
}

function collisionSampleCount(
  points: readonly KpOrganicPathPoint[],
  obstacles: readonly KpOrganicPathRect[],
  moverRadius: number
): number {
  return points.reduce(
    (total, point) =>
      total +
      obstacles.filter(
        (obstacle) =>
          point.x >= obstacle.left - moverRadius &&
          point.x <= obstacle.left + obstacle.width + moverRadius &&
          point.y >= obstacle.top - moverRadius &&
          point.y <= obstacle.top + obstacle.height + moverRadius
      ).length,
    0
  );
}

function polylineDistance(points: readonly KpOrganicPathPoint[]): number {
  return points.slice(1).reduce(
    (total, point, index) => total + distance(points[index]!, point),
    0
  );
}

function sampleQuadratic(
  start: KpOrganicPathPoint,
  control: KpOrganicPathPoint,
  end: KpOrganicPathPoint,
  progress: number
): KpOrganicPathPoint {
  const remaining = 1 - progress;
  return {
    x:
      remaining * remaining * start.x +
      2 * remaining * progress * control.x +
      progress * progress * end.x,
    y:
      remaining * remaining * start.y +
      2 * remaining * progress * control.y +
      progress * progress * end.y
  };
}

function rejectAuthoredRouting(input: KpOrganicPathPlanInput): void {
  Object.keys(input).forEach((key) => {
    if (/^(controlPoints?|waypoints?|routeNodes?|pathCoordinates?)$/i.test(key)) {
      throw new Error(
        `Organic path planning derives ${key} from scene geometry; authored routing is not allowed.`
      );
    }
  });
}

function validatePoint(point: KpOrganicPathPoint, label: string): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new Error(`${label} must contain finite measured coordinates.`);
  }
}

function validateRect(rect: KpOrganicPathRect, label: string): void {
  if (
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width < 0 ||
    rect.height < 0
  ) {
    throw new Error(`${label} must be a finite nonnegative measured rectangle.`);
  }
}

function distance(left: KpOrganicPathPoint, right: KpOrganicPathPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}

function nonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be finite and nonnegative.`);
  }
  return value;
}

function variantOrder(variant: KpOrganicPathVariant): number {
  return [
    "opposite-corner",
    "diagonal-arc-above",
    "diagonal-arc-below",
    "arc-above",
    "arc-below",
    "direct"
  ].indexOf(variant);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
