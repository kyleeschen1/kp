import type {
  KpPaintContinuityPlanDraft,
  KpVerifiedPaintContinuityPlan
} from "./paint-continuity-plan-types.ts";
import {
  operationPresentationPlanAuthorityId,
  type KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";

export type KpPaintContinuityPlanValidationIssueCode =
  | "plan.invalid-id"
  | "plan.authority-mismatch"
  | "plan.invalid-invariant"
  | "carrier.invalid-id"
  | "carrier.duplicate-lineage"
  | "carrier.invalid-topology"
  | "carrier.foreign-bundle"
  | "carrier.catalyst-contribution"
  | "carrier.ambiguous-bundle"
  | "carrier.missing-material";

export interface KpPaintContinuityPlanValidationIssue {
  readonly code: KpPaintContinuityPlanValidationIssueCode;
  readonly path: string;
  readonly message: string;
}

export type KpPaintContinuityPlanValidationResult =
  | {
      readonly status: "verified";
      readonly plan: KpVerifiedPaintContinuityPlan;
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly KpPaintContinuityPlanValidationIssue[];
    };

/**
 * This is the sole mint for executable paint ownership. It validates against
 * an already verified semantic plan so DOM structure or glyph text can never
 * be promoted into lineage authority.
 */
export function validateAndMintKpPaintContinuityPlan(input: {
  readonly draft: KpPaintContinuityPlanDraft;
  readonly operationPlan: KpVerifiedOperationPresentationPlan;
}): KpPaintContinuityPlanValidationResult {
  const issues: KpPaintContinuityPlanValidationIssue[] = [];
  const { draft, operationPlan } = input;
  validatePlanIdentity(draft, operationPlan, issues);

  const sourceIds = new Set(
    operationPlan.roles.bundles
      .filter(({ role }) => role === "source-material")
      .map(({ id }) => id)
  );
  const targetIds = new Set(
    operationPlan.roles.bundles
      .filter(({ role }) => role === "target-material")
      .map(({ id }) => id)
  );
  const catalystIds = new Set(
    operationPlan.roles.bundles
      .filter(({ role }) => role === "catalyst")
      .map(({ id }) => id)
  );
  const ownedSourceIds = new Map<string, string[]>();
  const ownedTargetIds = new Map<string, string[]>();
  const lineageIds = new Set<string>();

  if (draft.carriers.length === 0) {
    issues.push({
      code: "carrier.missing-material",
      path: "carriers",
      message: "Paint continuity requires at least one material carrier."
    });
  }

  draft.carriers.forEach((carrier, carrierIndex) => {
    const carrierPath = `carriers[${carrierIndex}]`;
    if (carrier.lineageId.trim().length === 0) {
      issues.push({
        code: "carrier.invalid-id",
        path: `${carrierPath}.lineageId`,
        message: "Paint carrier lineage id must not be empty."
      });
    } else if (lineageIds.has(carrier.lineageId)) {
      issues.push({
        code: "carrier.duplicate-lineage",
        path: `${carrierPath}.lineageId`,
        message: `Paint lineage ${carrier.lineageId} is duplicated.`
      });
    }
    lineageIds.add(carrier.lineageId);

    if (
      carrier.transferTopology !== "paint-equivalent-pose" &&
      carrier.transferTopology !== "shared-zero-area-junction"
    ) {
      issues.push({
        code: "carrier.invalid-topology",
        path: `${carrierPath}.transferTopology`,
        message:
          `Paint lineage ${carrier.lineageId} uses an illegal ownership ` +
          `topology ${String(carrier.transferTopology)}.`
      });
    }
    if (
      carrier.transferTopology === "paint-equivalent-pose" &&
      (
        carrier.sourceBundleIds.length !== 1 ||
        carrier.targetBundleIds.length !== 1
      )
    ) {
      issues.push({
        code: "carrier.invalid-topology",
        path: carrierPath,
        message:
          "Equivalent-pose ownership transfer requires exactly one source " +
          "and one target bundle."
      });
    }

    validateBundleSide({
      ids: carrier.sourceBundleIds,
      carrierPath,
      side: "source",
      expectedIds: sourceIds,
      catalystIds,
      owners: ownedSourceIds,
      issues
    });
    validateBundleSide({
      ids: carrier.targetBundleIds,
      carrierPath,
      side: "target",
      expectedIds: targetIds,
      catalystIds,
      owners: ownedTargetIds,
      issues
    });
  });

  validateTotalOwnership(sourceIds, ownedSourceIds, "source", issues);
  validateTotalOwnership(targetIds, ownedTargetIds, "target", issues);

  if (issues.length > 0) {
    return Object.freeze({
      status: "invalid",
      issues: Object.freeze(issues.map((issue) => Object.freeze(issue)))
    });
  }

  // The nominal cast is confined to this total semantic validator.
  return Object.freeze({
    status: "verified",
    plan: clonePlan(draft) as KpVerifiedPaintContinuityPlan
  });
}

function validatePlanIdentity(
  draft: KpPaintContinuityPlanDraft,
  operationPlan: KpVerifiedOperationPresentationPlan,
  issues: KpPaintContinuityPlanValidationIssue[]
): void {
  for (const [path, value] of [
    ["id", draft.id],
    ["transformationId", draft.transformationId]
  ] as const) {
    if (value.trim().length === 0) {
      issues.push({
        code: "plan.invalid-id",
        path,
        message: `Paint continuity plan ${path} must not be empty.`
      });
    }
  }
  if (
    draft.transformationId !== operationPlan.transformationId ||
    draft.operationPresentationPlanId !==
      operationPresentationPlanAuthorityId(operationPlan)
  ) {
    issues.push({
      code: "plan.authority-mismatch",
      path: "operationPresentationPlanId",
      message:
        "Paint continuity authority must match the verified semantic plan."
    });
  }
  if (
    draft.ownership !== "exclusive-continuous-carrier" ||
    draft.endpointSettlement !== "native-source-and-target" ||
    draft.nonZeroPaint !== "opaque"
  ) {
    issues.push({
      code: "plan.invalid-invariant",
      path: "ownership",
      message:
        "Paint continuity requires exclusive ownership, opaque non-zero " +
        "paint, and native source/target endpoints."
    });
  }
}

function validateBundleSide(input: {
  readonly ids: readonly string[];
  readonly carrierPath: string;
  readonly side: "source" | "target";
  readonly expectedIds: ReadonlySet<string>;
  readonly catalystIds: ReadonlySet<string>;
  readonly owners: Map<string, string[]>;
  readonly issues: KpPaintContinuityPlanValidationIssue[];
}): void {
  input.ids.forEach((bundleId, bundleIndex) => {
    const path =
      `${input.carrierPath}.${input.side}BundleIds[${bundleIndex}]`;
    const owners = input.owners.get(bundleId) ?? [];
    input.owners.set(bundleId, [...owners, input.carrierPath]);
    if (input.catalystIds.has(bundleId)) {
      input.issues.push({
        code: "carrier.catalyst-contribution",
        path,
        message: `Catalyst bundle ${bundleId} cannot carry result paint.`
      });
    } else if (!input.expectedIds.has(bundleId)) {
      input.issues.push({
        code: "carrier.foreign-bundle",
        path,
        message:
          `Paint continuity references foreign ${input.side} bundle ` +
          `${bundleId}.`
      });
    }
  });
}

function validateTotalOwnership(
  expectedIds: ReadonlySet<string>,
  owners: ReadonlyMap<string, readonly string[]>,
  side: "source" | "target",
  issues: KpPaintContinuityPlanValidationIssue[]
): void {
  for (const bundleId of expectedIds) {
    const bundleOwners = owners.get(bundleId) ?? [];
    if (bundleOwners.length === 0) {
      issues.push({
        code: "carrier.missing-material",
        path: "carriers",
        message: `Material ${side} bundle ${bundleId} has no paint carrier.`
      });
    } else if (bundleOwners.length > 1) {
      issues.push({
        code: "carrier.ambiguous-bundle",
        path: "carriers",
        message:
          `Material ${side} bundle ${bundleId} belongs to multiple paint ` +
          `carriers: ${bundleOwners.join(", ")}.`
      });
    }
  }
}

function clonePlan(
  draft: KpPaintContinuityPlanDraft
): KpPaintContinuityPlanDraft {
  return Object.freeze({
    ...draft,
    carriers: Object.freeze(draft.carriers.map((carrier) => Object.freeze({
      ...carrier,
      sourceBundleIds: cloneNonEmptyIds(carrier.sourceBundleIds),
      targetBundleIds: cloneNonEmptyIds(carrier.targetBundleIds)
    })))
  });
}

function cloneNonEmptyIds(
  ids: readonly [string, ...string[]]
): readonly [string, ...string[]] {
  const [first, ...rest] = ids;
  return Object.freeze([first, ...rest]);
}
