import type {
  KpReaderEquationMaterialPlan,
  KpReaderEquationMaterialOwnerPlan
} from "./equation-material-plan.ts";
import type {
  KpReaderEquationLayoutSnapshot,
  KpReaderEquationMeasuredAnchor,
  KpReaderLayoutRect
} from "./equation-layout-snapshot.ts";
import type {
  KpEquationStageMeasurementIdentity
} from "../runtime/equation-stage-layout.ts";

export interface KpReaderEquationPerceptualAlignmentPolicy {
  readonly maxInlineCorrectionPx: number;
  readonly maxBlockCorrectionPx: number;
  readonly anchorPriority: readonly (
    | "relation-center"
    | "ink-center"
    | "operator-center"
  )[];
}

export interface KpReaderEquationPerceptualAlignmentPlan {
  readonly id: string;
  readonly kind: "reader-equation-perceptual-alignment-plan";
  readonly layoutSnapshotId: string;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly direction: "forward" | "rewind";
  readonly referenceOwnerId?: string | undefined;
  readonly correction: {
    readonly x: number;
    readonly y: number;
    readonly rawX: number;
    readonly rawY: number;
    readonly clamped: boolean;
  };
  readonly owners: readonly KpReaderEquationAlignedOwner[];
}

export interface KpReaderEquationAlignedOwner {
  readonly ownerId: string;
  readonly sourceBounds?: KpReaderLayoutRect | undefined;
  readonly targetBounds?: KpReaderLayoutRect | undefined;
}

interface KpReaderEquationAlignmentReference {
  readonly ownerId: string;
  readonly sourceBounds: KpReaderLayoutRect;
  readonly targetBounds: KpReaderLayoutRect;
  readonly priority: number;
}

export const kpReaderEquationDefaultAlignmentPolicy = {
  maxInlineCorrectionPx: 24,
  maxBlockCorrectionPx: 8,
  anchorPriority: ["relation-center", "ink-center", "operator-center"]
} as const satisfies KpReaderEquationPerceptualAlignmentPolicy;

export function planKpReaderEquationPerceptualAlignment(input: {
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly policy?: KpReaderEquationPerceptualAlignmentPolicy | undefined;
}): KpReaderEquationPerceptualAlignmentPlan {
  if (input.layout.materialPlanId !== input.materialPlan.id) {
    throw new Error(
      `Layout ${input.layout.id} does not belong to material plan ${input.materialPlan.id}.`
    );
  }
  const transition = input.materialPlan.transitions.find(
    (candidate) => candidate.transitionId === input.layout.transitionId
  );
  if (transition === undefined) {
    throw new Error(
      `Material plan ${input.materialPlan.id} has no transition ${input.layout.transitionId}.`
    );
  }
  const policy = input.policy ?? kpReaderEquationDefaultAlignmentPolicy;
  assertPolicy(policy);
  const ownersById = new Map(
    transition.owners.map((owner) => [owner.id, owner])
  );
  const anchorsById = new Map(
    input.layout.anchors.map((anchor) => [anchor.id, anchor])
  );
  const reference = selectReferenceOwner(
    input.layout,
    ownersById,
    anchorsById,
    policy
  );
  const raw = reference === undefined
    ? { x: 0, y: 0 }
    : centerCorrection(reference.sourceBounds, reference.targetBounds);
  const correction = {
    x: clampSymmetric(raw.x, policy.maxInlineCorrectionPx),
    y: clampSymmetric(raw.y, policy.maxBlockCorrectionPx)
  };
  // Native KaTeX owns both exact endpoints. The correction is therefore a
  // path envelope, never a mutation of endpoint geometry.
  return {
    id: `alignment.${input.layout.id}`,
    kind: "reader-equation-perceptual-alignment-plan",
    layoutSnapshotId: input.layout.id,
    measurementIdentity: input.layout.measurementIdentity,
    direction: input.materialPlan.direction,
    ...(reference === undefined ? {} : { referenceOwnerId: reference.ownerId }),
    correction: {
      ...correction,
      rawX: raw.x,
      rawY: raw.y,
      clamped: correction.x !== raw.x || correction.y !== raw.y
    },
    owners: input.layout.owners.map((owner) => ({
      ownerId: owner.ownerId,
      ...(owner.sourceBounds === undefined
        ? {}
        : { sourceBounds: owner.sourceBounds }),
      ...(owner.targetBounds === undefined
        ? {}
        : { targetBounds: owner.targetBounds })
    }))
  };
}

export function sampleKpReaderEquationPerceptualPathOffset(input: {
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly progress: number;
}): { readonly x: number; readonly y: number } {
  if (!Number.isFinite(input.progress)) {
    throw new Error("Equation perceptual path progress must be finite.");
  }
  const progress = Math.max(0, Math.min(1, input.progress));
  const envelope = 2 * progress * (1 - progress);
  const direction = input.alignment.direction === "forward" ? 1 : -1;
  return {
    x: direction * input.alignment.correction.x * envelope,
    y: direction * input.alignment.correction.y * envelope
  };
}

function selectReferenceOwner(
  layout: KpReaderEquationLayoutSnapshot,
  ownersById: ReadonlyMap<string, KpReaderEquationMaterialOwnerPlan>,
  anchorsById: ReadonlyMap<string, KpReaderEquationMeasuredAnchor>,
  policy: KpReaderEquationPerceptualAlignmentPolicy
): KpReaderEquationAlignmentReference | undefined {
  const candidates: KpReaderEquationAlignmentReference[] = layout.owners.flatMap((measured) => {
    if (measured.sourceBounds === undefined || measured.targetBounds === undefined) {
      return [];
    }
    const owner = ownersById.get(measured.ownerId);
    if (owner === undefined) return [];
    const kinds = [...owner.sourceAnchorIds, ...owner.targetAnchorIds]
      .flatMap((anchorId) => {
        const anchor = anchorsById.get(anchorId);
        return anchor === undefined ? [] : [anchor.anchorKind];
      });
    const priority = Math.min(
      ...kinds.map((kind) => {
        const index = policy.anchorPriority.indexOf(kind);
        return index === -1 ? policy.anchorPriority.length : index;
      })
    );
    return [{
      ownerId: measured.ownerId,
      sourceBounds: measured.sourceBounds,
      targetBounds: measured.targetBounds,
      priority
    }];
  });
  return candidates.sort((left, right) =>
    left.priority - right.priority || left.ownerId.localeCompare(right.ownerId)
  )[0];
}

function centerCorrection(
  source: KpReaderLayoutRect,
  target: KpReaderLayoutRect
): { readonly x: number; readonly y: number } {
  return {
    x: source.left + source.width / 2 - (target.left + target.width / 2),
    y: source.top + source.height / 2 - (target.top + target.height / 2)
  };
}

function clampSymmetric(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

function assertPolicy(policy: KpReaderEquationPerceptualAlignmentPolicy): void {
  if (
    !Number.isFinite(policy.maxInlineCorrectionPx) ||
    policy.maxInlineCorrectionPx < 0 ||
    !Number.isFinite(policy.maxBlockCorrectionPx) ||
    policy.maxBlockCorrectionPx < 0
  ) {
    throw new Error("Equation alignment correction bounds must be finite and non-negative.");
  }
  if (policy.anchorPriority.length === 0) {
    throw new Error("Equation alignment policy requires an anchor priority.");
  }
}
