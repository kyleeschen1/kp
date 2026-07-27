import {
  sampleKpEquationMotionPath,
  type KpEquationMotionPathCandidate
} from "./equation-motion-path-planner.ts";

export interface KpMotionQualityEntitySample {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
  readonly radius?: number | undefined;
  readonly salient?: boolean | undefined;
}

export interface KpMotionQualityFrameSample {
  readonly progress: number;
  readonly entities: readonly KpMotionQualityEntitySample[];
}

export interface KpMotionQualityCorridor {
  readonly entityId: string;
  readonly start: { readonly x: number; readonly y: number };
  readonly end: { readonly x: number; readonly y: number };
  readonly maxOrthogonalExcursion: number;
}

export interface KpMotionQualityBudget {
  readonly durationMs: number;
  readonly maxPositionStep: number;
  readonly maxVelocityPerSecond: number;
  readonly maxAccelerationPerSecondSquared: number;
  readonly maxScaleStep: number;
  readonly maxBoundaryPositionStep: number;
  readonly minCollisionSeparation: number;
  readonly minCrowdingSeparation: number;
  readonly minSalienceOpacity: number;
}

export interface KpMotionQualityDiagnostic {
  readonly code:
    | "motion.position-discontinuity"
    | "motion.velocity-budget"
    | "motion.acceleration-budget"
    | "motion.scale-discontinuity"
    | "motion.boundary-discontinuity"
    | "motion.path-excursion"
    | "motion.collision"
    | "motion.crowding"
    | "motion.salience-gap";
  readonly severity: "error" | "warning";
  readonly progress: number;
  readonly entityIds: readonly string[];
  readonly measured: number;
  readonly budget: number;
  readonly message: string;
}

export interface KpMotionQualityReport {
  readonly kind: "motion-quality-report";
  readonly passed: boolean;
  readonly score: number;
  readonly sampleCount: number;
  readonly metrics: {
    readonly maxPositionStep: number;
    readonly maxVelocityPerSecond: number;
    readonly maxAccelerationPerSecondSquared: number;
    readonly maxScaleStep: number;
    readonly maxPathExcursion: number;
    readonly minEntitySeparation: number | null;
  };
  readonly diagnostics: readonly KpMotionQualityDiagnostic[];
}

export const defaultKpMotionQualityBudget: KpMotionQualityBudget = {
  durationMs: 1200,
  maxPositionStep: 18,
  maxVelocityPerSecond: 240,
  maxAccelerationPerSecondSquared: 1400,
  maxScaleStep: 0.12,
  maxBoundaryPositionStep: 8,
  minCollisionSeparation: 2,
  minCrowdingSeparation: 8,
  minSalienceOpacity: 0.45
};

export function sampleKpContinuousMotionPose(input: {
  readonly path: Pick<KpEquationMotionPathCandidate, "start" | "control" | "end">;
  readonly progress: number;
  readonly fromScale?: number | undefined;
  readonly toScale?: number | undefined;
  readonly easing?: "smoothstep" | "smootherstep" | undefined;
}): { readonly x: number; readonly y: number; readonly scale: number } {
  const p = clamp01(input.progress);
  const eased = input.easing === "smoothstep" ? smoothstep(p) : smootherstep(p);
  const point = sampleKpEquationMotionPath(input.path, eased);
  const fromScale = input.fromScale ?? 1;
  const toScale = input.toScale ?? 1;
  return {
    ...point,
    scale: fromScale + (toScale - fromScale) * eased
  };
}

export function evaluateKpMotionQuality(input: {
  readonly samples: readonly KpMotionQualityFrameSample[];
  readonly budget?: Partial<KpMotionQualityBudget> | undefined;
  readonly motifBoundaryProgresses?: readonly number[] | undefined;
  readonly corridors?: readonly KpMotionQualityCorridor[] | undefined;
}): KpMotionQualityReport {
  const budget = { ...defaultKpMotionQualityBudget, ...input.budget };
  validateBudget(budget);
  const samples = normalizedSamples(input.samples);
  const diagnostics: KpMotionQualityDiagnostic[] = [];
  let maxPositionStep = 0;
  let maxVelocityPerSecond = 0;
  let maxAccelerationPerSecondSquared = 0;
  let maxScaleStep = 0;
  let maxPathExcursion = 0;
  let minEntitySeparation = Number.POSITIVE_INFINITY;
  const previousVelocity = new Map<string, { value: number; progress: number }>();

  samples.forEach((sample, sampleIndex) => {
    inspectSeparation(sample, budget, diagnostics, (value) => {
      minEntitySeparation = Math.min(minEntitySeparation, value);
    });
    inspectSalience(sample, budget, diagnostics);
    inspectCorridors(
      sample,
      input.corridors ?? [],
      diagnostics,
      (value) => {
        maxPathExcursion = Math.max(maxPathExcursion, value);
      }
    );
    if (sampleIndex === 0) return;
    const previous = samples[sampleIndex - 1]!;
    const deltaProgress = sample.progress - previous.progress;
    const deltaSeconds = deltaProgress * budget.durationMs / 1000;
    const previousById = new Map(previous.entities.map((entity) => [entity.id, entity]));
    sample.entities.forEach((entity) => {
      const before = previousById.get(entity.id);
      if (before === undefined) return;
      const distance = Math.hypot(entity.x - before.x, entity.y - before.y);
      const scaleStep = Math.abs(entity.scale - before.scale);
      const velocity = distance / deltaSeconds;
      maxPositionStep = Math.max(maxPositionStep, distance);
      maxScaleStep = Math.max(maxScaleStep, scaleStep);
      maxVelocityPerSecond = Math.max(maxVelocityPerSecond, velocity);
      if (distance > budget.maxPositionStep) {
        diagnostics.push(diagnostic(
          "motion.position-discontinuity",
          "error",
          sample.progress,
          [entity.id],
          distance,
          budget.maxPositionStep,
          `Entity ${entity.id} moves ${distance.toFixed(2)}px between adjacent samples.`
        ));
      }
      if (velocity > budget.maxVelocityPerSecond) {
        diagnostics.push(diagnostic(
          "motion.velocity-budget",
          "warning",
          sample.progress,
          [entity.id],
          velocity,
          budget.maxVelocityPerSecond,
          `Entity ${entity.id} exceeds the velocity budget.`
        ));
      }
      if (scaleStep > budget.maxScaleStep) {
        diagnostics.push(diagnostic(
          "motion.scale-discontinuity",
          "error",
          sample.progress,
          [entity.id],
          scaleStep,
          budget.maxScaleStep,
          `Entity ${entity.id} changes scale discontinuously.`
        ));
      }
      const priorVelocity = previousVelocity.get(entity.id);
      if (priorVelocity !== undefined) {
        const accelerationSeconds = (sample.progress - priorVelocity.progress) *
          budget.durationMs / 1000;
        const acceleration = Math.abs(velocity - priorVelocity.value) / accelerationSeconds;
        maxAccelerationPerSecondSquared = Math.max(
          maxAccelerationPerSecondSquared,
          acceleration
        );
        if (acceleration > budget.maxAccelerationPerSecondSquared) {
          diagnostics.push(diagnostic(
            "motion.acceleration-budget",
            "warning",
            sample.progress,
            [entity.id],
            acceleration,
            budget.maxAccelerationPerSecondSquared,
            `Entity ${entity.id} exceeds the acceleration budget.`
          ));
        }
      }
      previousVelocity.set(entity.id, { value: velocity, progress: sample.progress });
    });
  });
  inspectBoundaries(
    samples,
    input.motifBoundaryProgresses ?? [],
    budget,
    diagnostics
  );
  const errors = diagnostics.filter((item) => item.severity === "error").length;
  const warnings = diagnostics.length - errors;

  return {
    kind: "motion-quality-report",
    passed: errors === 0,
    score: Math.max(0, 100 - errors * 25 - warnings * 4),
    sampleCount: samples.length,
    metrics: {
      maxPositionStep,
      maxVelocityPerSecond,
      maxAccelerationPerSecondSquared,
      maxScaleStep,
      maxPathExcursion,
      minEntitySeparation: Number.isFinite(minEntitySeparation)
        ? minEntitySeparation
        : null
    },
    diagnostics
  };
}

function inspectCorridors(
  sample: KpMotionQualityFrameSample,
  corridors: readonly KpMotionQualityCorridor[],
  diagnostics: KpMotionQualityDiagnostic[],
  observe: (value: number) => void
): void {
  const entitiesById = new Map(sample.entities.map((entity) => [
    entity.id,
    entity
  ]));
  for (const corridor of corridors) {
    if (
      !Number.isFinite(corridor.maxOrthogonalExcursion) ||
      corridor.maxOrthogonalExcursion <= 0
    ) {
      throw new Error(
        `Motion corridor ${corridor.entityId} requires positive excursion.`
      );
    }
    const entity = entitiesById.get(corridor.entityId);
    if (entity === undefined) continue;
    const excursion = orthogonalDistance(
      entity,
      corridor.start,
      corridor.end
    );
    observe(excursion);
    if (excursion > corridor.maxOrthogonalExcursion) {
      diagnostics.push(diagnostic(
        "motion.path-excursion",
        "error",
        sample.progress,
        [entity.id],
        excursion,
        corridor.maxOrthogonalExcursion,
        `Entity ${entity.id} leaves its motion corridor by ` +
          `${excursion.toFixed(2)}px.`
      ));
    }
  }
}

function orthogonalDistance(
  point: { readonly x: number; readonly y: number },
  start: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number }
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  return Math.abs(dx * (start.y - point.y) - (start.x - point.x) * dy) /
    length;
}

function inspectSeparation(
  sample: KpMotionQualityFrameSample,
  budget: KpMotionQualityBudget,
  diagnostics: KpMotionQualityDiagnostic[],
  observe: (value: number) => void
): void {
  const visible = sample.entities.filter((entity) => entity.opacity > 0.05);
  visible.forEach((left, leftIndex) => {
    visible.slice(leftIndex + 1).forEach((right) => {
      const separation = Math.max(
        0,
        Math.hypot(left.x - right.x, left.y - right.y) -
          (left.radius ?? 0) -
          (right.radius ?? 0)
      );
      observe(separation);
      if (separation < budget.minCollisionSeparation) {
        diagnostics.push(diagnostic(
          "motion.collision",
          "error",
          sample.progress,
          [left.id, right.id],
          separation,
          budget.minCollisionSeparation,
          `${left.id} and ${right.id} collide.`
        ));
      } else if (separation < budget.minCrowdingSeparation) {
        diagnostics.push(diagnostic(
          "motion.crowding",
          "warning",
          sample.progress,
          [left.id, right.id],
          separation,
          budget.minCrowdingSeparation,
          `${left.id} and ${right.id} are visually crowded.`
        ));
      }
    });
  });
}

function inspectSalience(
  sample: KpMotionQualityFrameSample,
  budget: KpMotionQualityBudget,
  diagnostics: KpMotionQualityDiagnostic[]
): void {
  const salient = sample.entities.filter((entity) => entity.salient);
  if (salient.length === 0) return;
  const peak = Math.max(...salient.map((entity) => entity.opacity));
  if (peak < budget.minSalienceOpacity) {
    diagnostics.push(diagnostic(
      "motion.salience-gap",
      "error",
      sample.progress,
      salient.map((entity) => entity.id),
      peak,
      budget.minSalienceOpacity,
      "No salient semantic entity remains perceptually available."
    ));
  }
}

function inspectBoundaries(
  samples: readonly KpMotionQualityFrameSample[],
  boundaries: readonly number[],
  budget: KpMotionQualityBudget,
  diagnostics: KpMotionQualityDiagnostic[]
): void {
  boundaries.forEach((boundary) => {
    const before = [...samples].reverse().find((sample) => sample.progress <= boundary);
    const after = samples.find((sample) => sample.progress >= boundary);
    if (before === undefined || after === undefined || before === after) return;
    const beforeById = new Map(before.entities.map((entity) => [entity.id, entity]));
    after.entities.forEach((entity) => {
      const prior = beforeById.get(entity.id);
      if (prior === undefined) return;
      const distance = Math.hypot(entity.x - prior.x, entity.y - prior.y);
      if (distance > budget.maxBoundaryPositionStep) {
        diagnostics.push(diagnostic(
          "motion.boundary-discontinuity",
          "error",
          boundary,
          [entity.id],
          distance,
          budget.maxBoundaryPositionStep,
          `Entity ${entity.id} jumps across a motif boundary.`
        ));
      }
    });
  });
}

function normalizedSamples(
  samples: readonly KpMotionQualityFrameSample[]
): readonly KpMotionQualityFrameSample[] {
  if (samples.length < 2) throw new Error("Motion quality evaluation requires two samples.");
  const ordered = samples.map((sample) => ({
    progress: clamp01(sample.progress),
    entities: sample.entities.map((entity) => ({ ...entity }))
  })).sort((left, right) => left.progress - right.progress);
  ordered.slice(1).forEach((sample, index) => {
    if (sample.progress <= ordered[index]!.progress) {
      throw new Error("Motion quality sample progress must be unique.");
    }
  });
  return ordered;
}

function validateBudget(budget: KpMotionQualityBudget): void {
  Object.entries(budget).forEach(([key, value]) => {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Motion quality budget ${key} must be positive.`);
    }
  });
}

function diagnostic(
  code: KpMotionQualityDiagnostic["code"],
  severity: KpMotionQualityDiagnostic["severity"],
  progress: number,
  entityIds: readonly string[],
  measured: number,
  budget: number,
  message: string
): KpMotionQualityDiagnostic {
  return { code, severity, progress, entityIds: [...entityIds], measured, budget, message };
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function smootherstep(progress: number): number {
  return progress * progress * progress *
    (progress * (progress * 6 - 15) + 10);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
