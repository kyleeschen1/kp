import {
  kpDefaultMaterialContinuityQualityBudgets,
  type KpMaterialContinuityQualityBudgets
} from "./material-continuity-quality.ts";
import type {
  KpPaintContinuityCarrierDraft,
  KpVerifiedPaintContinuityPlan
} from "./paint-continuity-plan-types.ts";

export interface KpPaintContinuityObservation {
  readonly id: string;
  readonly lineageId: string;
  readonly bundleId: string;
  readonly ownerId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly opacity: number;
  readonly styleFingerprint: string;
  readonly structureFingerprint: string;
}

export interface KpPaintContinuitySnapshot {
  readonly progress: number;
  readonly observations: readonly KpPaintContinuityObservation[];
}

export type KpPaintContinuityDiagnosticCode =
  | "paint.invalid-sample"
  | "paint.foreign-lineage"
  | "paint.foreign-bundle"
  | "paint.missing-source"
  | "paint.missing-target"
  | "paint.non-opaque"
  | "paint.junction-nonzero"
  | "paint.owner-displacement"
  | "paint.owner-style"
  | "paint.owner-structure"
  | "paint.owner-scale-skew"
  | "paint.blank-interval"
  | "paint.competing-complete-states"
  | "paint.duplicate-owner"
  | "paint.leaf-pose-drift";

export interface KpPaintContinuityDiagnostic {
  readonly code: KpPaintContinuityDiagnosticCode;
  readonly path: string;
  readonly message: string;
}

export interface KpPaintContinuityBoundaryReport {
  readonly lawId: "paint-continuity.t-epsilon-boundary";
  readonly passed: boolean;
  readonly boundaryProgress: number;
  readonly sampleProgresses: readonly [number, number, number];
  readonly diagnostics: readonly KpPaintContinuityDiagnostic[];
}

export interface KpAdjacentPhasePaintLeafSnapshot {
  readonly leafId: string;
  readonly ownerIds: readonly string[];
  readonly visible: boolean;
  readonly poseFingerprint: string;
}

export interface KpAdjacentPhasePaintSnapshot {
  readonly stateId: string;
  readonly leaves: readonly KpAdjacentPhasePaintLeafSnapshot[];
}

export interface KpAdjacentPhasePaintDiagnosticReport {
  readonly lawId: "paint-continuity.adjacent-phase-seam";
  readonly passed: boolean;
  readonly diagnostics: readonly KpPaintContinuityDiagnostic[];
}

export function evaluateKpAdjacentPhasePaintSeam(input: {
  readonly from: KpAdjacentPhasePaintSnapshot;
  readonly to: KpAdjacentPhasePaintSnapshot;
  readonly simultaneouslyCompleteStateIds?: readonly string[] | undefined;
}): KpAdjacentPhasePaintDiagnosticReport {
  const diagnostics: KpPaintContinuityDiagnostic[] = [];
  const completeStateIds = [
    ...new Set(input.simultaneouslyCompleteStateIds ?? [])
  ];
  if (completeStateIds.length > 1) {
    diagnostics.push({
      code: "paint.competing-complete-states",
      path: "simultaneouslyCompleteStateIds",
      message:
        `Adjacent seam exposes competing complete states: ` +
        `${completeStateIds.join(", ")}.`
    });
  }
  const fromLeaves = indexAdjacentLeaves(input.from, "from", diagnostics);
  const toLeaves = indexAdjacentLeaves(input.to, "to", diagnostics);
  const leafIds = [...new Set([...fromLeaves.keys(), ...toLeaves.keys()])];
  for (const leafId of leafIds) {
    const from = fromLeaves.get(leafId);
    const to = toLeaves.get(leafId);
    if (from === undefined || to === undefined || !from.visible || !to.visible) {
      diagnostics.push({
        code: "paint.blank-interval",
        path: `leaves.${leafId}`,
        message:
          `Semantic paint leaf ${leafId} is absent from one side of the seam.`
      });
      continue;
    }
    if (from.poseFingerprint !== to.poseFingerprint) {
      diagnostics.push({
        code: "paint.leaf-pose-drift",
        path: `leaves.${leafId}.poseFingerprint`,
        message:
          `Semantic paint leaf ${leafId} changes physical pose at the seam.`
      });
    }
  }
  return Object.freeze({
    lawId: "paint-continuity.adjacent-phase-seam",
    passed: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics.map((diagnostic) =>
      Object.freeze(diagnostic)
    ))
  });
}

function indexAdjacentLeaves(
  snapshot: KpAdjacentPhasePaintSnapshot,
  side: "from" | "to",
  diagnostics: KpPaintContinuityDiagnostic[]
): ReadonlyMap<string, KpAdjacentPhasePaintLeafSnapshot> {
  const leaves = new Map<string, KpAdjacentPhasePaintLeafSnapshot>();
  snapshot.leaves.forEach((leaf, index) => {
    if (leaves.has(leaf.leafId)) {
      diagnostics.push({
        code: "paint.duplicate-owner",
        path: `${side}.leaves[${index}].leafId`,
        message: `Semantic paint leaf ${leaf.leafId} is duplicated.`
      });
    } else {
      leaves.set(leaf.leafId, leaf);
    }
    if (leaf.ownerIds.length !== 1) {
      diagnostics.push({
        code: "paint.duplicate-owner",
        path: `${side}.leaves[${index}].ownerIds`,
        message:
          `Semantic paint leaf ${leaf.leafId} requires exactly one owner; ` +
          `received ${leaf.ownerIds.length}.`
      });
    }
  });
  return leaves;
}

/**
 * The same pure t-epsilon law is used by unit, browser, natural-playback, and
 * rewind checks. That keeps a renderer from passing direct-seek tests while
 * hiding a one-frame ownership swap in its player lifecycle.
 */
export function evaluateKpPaintContinuityBoundary(input: {
  readonly plan: KpVerifiedPaintContinuityPlan;
  readonly boundaryProgress: number;
  readonly sample: (progress: number) => KpPaintContinuitySnapshot;
  readonly epsilonProgress?: number | undefined;
  readonly budgets?: KpMaterialContinuityQualityBudgets | undefined;
  readonly zeroAreaTolerancePx2?: number | undefined;
}): KpPaintContinuityBoundaryReport {
  const boundaryProgress = unit(input.boundaryProgress, "boundaryProgress");
  const epsilon = positive(
    input.epsilonProgress ?? 1 / 1_000,
    "epsilonProgress"
  );
  const zeroAreaTolerance = nonnegative(
    input.zeroAreaTolerancePx2 ?? 1e-4,
    "zeroAreaTolerancePx2"
  );
  const sampleProgresses = [
    Math.max(0, boundaryProgress - epsilon),
    boundaryProgress,
    Math.min(1, boundaryProgress + epsilon)
  ] as const;
  const snapshots = sampleProgresses.map(input.sample) as [
    KpPaintContinuitySnapshot,
    KpPaintContinuitySnapshot,
    KpPaintContinuitySnapshot
  ];
  const diagnostics: KpPaintContinuityDiagnostic[] = [];
  const carrierByLineage = new Map(
    input.plan.carriers.map((carrier) => [carrier.lineageId, carrier])
  );

  snapshots.forEach((snapshot, snapshotIndex) => {
    validateSnapshotProgress(
      snapshot,
      sampleProgresses[snapshotIndex]!,
      snapshotIndex,
      diagnostics
    );
    snapshot.observations.forEach((observation, observationIndex) => {
      const path = `samples[${snapshotIndex}].observations[${observationIndex}]`;
      const carrier = carrierByLineage.get(observation.lineageId);
      if (carrier === undefined) {
        diagnostics.push({
          code: "paint.foreign-lineage",
          path: `${path}.lineageId`,
          message:
            `Observation references foreign lineage ` +
            `${observation.lineageId}.`
        });
        return;
      }
      if (!allowedBundleIds(carrier).has(observation.bundleId)) {
        diagnostics.push({
          code: "paint.foreign-bundle",
          path: `${path}.bundleId`,
          message:
            `Lineage ${carrier.lineageId} does not own bundle ` +
            `${observation.bundleId}.`
        });
      }
      validateObservation(observation, path, zeroAreaTolerance, diagnostics);
    });
  });

  for (const carrier of input.plan.carriers) {
    const [before, at, after] = snapshots.map((snapshot) =>
      snapshot.observations.filter(
        ({ lineageId }) => lineageId === carrier.lineageId
      )
    ) as [
      KpPaintContinuityObservation[],
      KpPaintContinuityObservation[],
      KpPaintContinuityObservation[]
    ];
    requireEndpointBundles(
      carrier,
      before,
      after,
      zeroAreaTolerance,
      diagnostics
    );
    if (carrier.transferTopology === "shared-zero-area-junction") {
      for (const [index, observation] of at.entries()) {
        if (paintArea(observation) > zeroAreaTolerance) {
          diagnostics.push({
            code: "paint.junction-nonzero",
            path:
              `lineages.${carrier.lineageId}.at[${index}]`,
            message:
              `Shared junction ${carrier.lineageId} retains non-zero paint ` +
              `area ${round(paintArea(observation))}.`
          });
        }
      }
    } else {
      const source = visibleForBundles(
        before,
        carrier.sourceBundleIds,
        zeroAreaTolerance
      )[0];
      const target = visibleForBundles(
        after,
        carrier.targetBundleIds,
        zeroAreaTolerance
      )[0];
      if (source !== undefined && target !== undefined) {
        compareOwnerPose({
          before: source,
          after: target,
          path: `lineages.${carrier.lineageId}.equivalentPose`,
          budgets: input.budgets ??
            kpDefaultMaterialContinuityQualityBudgets,
          diagnostics
        });
      }
    }

    const beforeByOwner = new Map(before.map((item) => [item.ownerId, item]));
    for (const item of after) {
      const prior = beforeByOwner.get(item.ownerId);
      if (prior === undefined) continue;
      compareOwnerPose({
        before: prior,
        after: item,
        path: `lineages.${carrier.lineageId}.owners.${item.ownerId}`,
        budgets: input.budgets ?? kpDefaultMaterialContinuityQualityBudgets,
        diagnostics
      });
    }
  }

  return Object.freeze({
    lawId: "paint-continuity.t-epsilon-boundary",
    passed: diagnostics.length === 0,
    boundaryProgress,
    sampleProgresses: Object.freeze(sampleProgresses),
    diagnostics: Object.freeze(
      diagnostics.map((diagnostic) => Object.freeze(diagnostic))
    )
  });
}

function validateSnapshotProgress(
  snapshot: KpPaintContinuitySnapshot,
  expected: number,
  index: number,
  diagnostics: KpPaintContinuityDiagnostic[]
): void {
  if (
    !Number.isFinite(snapshot.progress) ||
    Math.abs(snapshot.progress - expected) > 1e-9
  ) {
    diagnostics.push({
      code: "paint.invalid-sample",
      path: `samples[${index}].progress`,
      message:
        `Boundary sample expected progress ${expected}, received ` +
        `${snapshot.progress}.`
    });
  }
}

function validateObservation(
  observation: KpPaintContinuityObservation,
  path: string,
  zeroAreaTolerance: number,
  diagnostics: KpPaintContinuityDiagnostic[]
): void {
  const finite = [
    observation.x,
    observation.y,
    observation.width,
    observation.height,
    observation.scaleX,
    observation.scaleY,
    observation.opacity
  ].every(Number.isFinite);
  if (
    !finite ||
    observation.width < 0 ||
    observation.height < 0 ||
    observation.scaleX < 0 ||
    observation.scaleY < 0 ||
    observation.opacity < 0 ||
    observation.opacity > 1
  ) {
    diagnostics.push({
      code: "paint.invalid-sample",
      path,
      message: "Paint observations require finite non-negative geometry and unit opacity."
    });
    return;
  }
  if (
    paintArea(observation) > zeroAreaTolerance &&
    Math.abs(observation.opacity - 1) > 1e-6
  ) {
    diagnostics.push({
      code: "paint.non-opaque",
      path: `${path}.opacity`,
      message:
        `Non-zero paint ${observation.id} must remain opaque; received ` +
        `${observation.opacity}.`
    });
  }
}

function requireEndpointBundles(
  carrier: KpPaintContinuityCarrierDraft,
  before: readonly KpPaintContinuityObservation[],
  after: readonly KpPaintContinuityObservation[],
  zeroAreaTolerance: number,
  diagnostics: KpPaintContinuityDiagnostic[]
): void {
  for (const bundleId of carrier.sourceBundleIds) {
    if (
      !before.some((item) =>
        item.bundleId === bundleId && paintArea(item) > zeroAreaTolerance
      )
    ) {
      diagnostics.push({
        code: "paint.missing-source",
        path: `lineages.${carrier.lineageId}.before`,
        message: `Source bundle ${bundleId} has no non-zero paint before transfer.`
      });
    }
  }
  for (const bundleId of carrier.targetBundleIds) {
    if (
      !after.some((item) =>
        item.bundleId === bundleId && paintArea(item) > zeroAreaTolerance
      )
    ) {
      diagnostics.push({
        code: "paint.missing-target",
        path: `lineages.${carrier.lineageId}.after`,
        message: `Target bundle ${bundleId} has no non-zero paint after transfer.`
      });
    }
  }
}

function compareOwnerPose(input: {
  readonly before: KpPaintContinuityObservation;
  readonly after: KpPaintContinuityObservation;
  readonly path: string;
  readonly budgets: KpMaterialContinuityQualityBudgets;
  readonly diagnostics: KpPaintContinuityDiagnostic[];
}): void {
  const displacement = Math.hypot(
    input.after.x - input.before.x,
    input.after.y - input.before.y
  );
  if (displacement > input.budgets.maximumBoundaryDisplacementPx) {
    input.diagnostics.push({
      code: "paint.owner-displacement",
      path: input.path,
      message:
        `Paint owner moves ${round(displacement)}px across the boundary; ` +
        `limit is ${input.budgets.maximumBoundaryDisplacementPx}px.`
    });
  }
  if (input.before.styleFingerprint !== input.after.styleFingerprint) {
    input.diagnostics.push({
      code: "paint.owner-style",
      path: `${input.path}.styleFingerprint`,
      message: "Paint owner changes computed-style fingerprint at transfer."
    });
  }
  if (
    input.before.structureFingerprint !== input.after.structureFingerprint
  ) {
    input.diagnostics.push({
      code: "paint.owner-structure",
      path: `${input.path}.structureFingerprint`,
      message: "Paint owner changes structural fingerprint at transfer."
    });
  }
  const scaleSkew = Math.max(
    Math.abs(input.after.scaleX - input.before.scaleX),
    Math.abs(input.after.scaleY - input.before.scaleY)
  );
  if (scaleSkew > input.budgets.maximumStructuralScaleSkew) {
    input.diagnostics.push({
      code: "paint.owner-scale-skew",
      path: input.path,
      message:
        `Paint owner scale changes ${round(scaleSkew)} across the boundary; ` +
        `limit is ${input.budgets.maximumStructuralScaleSkew}.`
    });
  }
}

function visibleForBundles(
  observations: readonly KpPaintContinuityObservation[],
  bundleIds: readonly string[],
  zeroAreaTolerance: number
): KpPaintContinuityObservation[] {
  const allowed = new Set(bundleIds);
  return observations.filter((item) =>
    allowed.has(item.bundleId) && paintArea(item) > zeroAreaTolerance
  );
}

function allowedBundleIds(
  carrier: KpPaintContinuityCarrierDraft
): ReadonlySet<string> {
  return new Set([
    ...carrier.sourceBundleIds,
    ...carrier.targetBundleIds
  ]);
}

function paintArea(observation: KpPaintContinuityObservation): number {
  return observation.width * observation.height *
    observation.scaleX * observation.scaleY;
}

function unit(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be between zero and one.`);
  }
  return value;
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be positive.`);
  }
  return value;
}

function nonnegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be non-negative.`);
  }
  return value;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
