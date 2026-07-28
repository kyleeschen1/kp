import type {
  KpOperationPresentationPlanDraft,
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import type {
  KpOperationPresentationGroup,
  KpOperationPresentationRoles
} from "./operation-presentation-roles.ts";

export type KpOperationPresentationPlanValidationIssueCode =
  | "plan.invalid-id"
  | "selector.invalid-inventory"
  | "selector.missing-role"
  | "selector.foreign"
  | "selector.ambiguous-role"
  | "group.foreign-bundle"
  | "plan.foreign-bundle"
  | "plan.foreign-group"
  | "plan.group-kind";

export interface KpOperationPresentationPlanValidationIssue {
  readonly code: KpOperationPresentationPlanValidationIssueCode;
  readonly path: string;
  readonly selectorId?: string | undefined;
  readonly message: string;
}

export type KpOperationPresentationPlanValidationResult =
  | {
      readonly status: "verified";
      readonly plan: KpVerifiedOperationPresentationPlan;
    }
  | {
      readonly status: "invalid";
      readonly issues: readonly KpOperationPresentationPlanValidationIssue[];
    };

/**
 * This is the sole mint for executable presentation plans. It accepts semantic
 * selector inventory from the trusted transition compiler; renderers never
 * infer role membership from glyph text, DOM position, or measured geometry.
 */
export function validateAndMintKpOperationPresentationPlan(input: {
  readonly draft: KpOperationPresentationPlanDraft;
  readonly expectedSelectorIds: readonly string[];
}): KpOperationPresentationPlanValidationResult {
  const issues: KpOperationPresentationPlanValidationIssue[] = [];
  requireUniqueInventory(input.expectedSelectorIds, issues);
  validateIds(input.draft, issues);

  const expected = new Set(input.expectedSelectorIds);
  const bundleById = new Map(
    input.draft.roles.bundles.map((bundle) => [bundle.id, bundle])
  );
  const groupById = new Map(
    input.draft.roles.groups.map((group) => [group.id, group])
  );
  const selectorOwners = new Map<string, string[]>();

  input.draft.roles.bundles.forEach((bundle, bundleIndex) => {
    bundle.semanticEntityIds.forEach((selectorId, selectorIndex) => {
      const owners = selectorOwners.get(selectorId) ?? [];
      selectorOwners.set(selectorId, [...owners, bundle.id]);
      if (!expected.has(selectorId)) {
        issues.push({
          code: "selector.foreign",
          path:
            `roles.bundles[${bundleIndex}].semanticEntityIds[` +
            `${selectorIndex}]`,
          selectorId,
          message: `Presentation role references foreign selector ${selectorId}.`
        });
      }
    });
  });

  input.expectedSelectorIds.forEach((selectorId, selectorIndex) => {
    const owners = selectorOwners.get(selectorId) ?? [];
    if (owners.length === 0) {
      issues.push({
        code: "selector.missing-role",
        path: `expectedSelectorIds[${selectorIndex}]`,
        selectorId,
        message: `Selector ${selectorId} has no presentation role.`
      });
    } else if (owners.length > 1) {
      issues.push({
        code: "selector.ambiguous-role",
        path: `expectedSelectorIds[${selectorIndex}]`,
        selectorId,
        message:
          `Selector ${selectorId} belongs to multiple bundles: ` +
          `${owners.join(", ")}.`
      });
    }
  });

  input.draft.roles.groups.forEach((group, groupIndex) => {
    group.bundleIds.forEach((bundleId, bundleIndex) => {
      if (!bundleById.has(bundleId)) {
        issues.push({
          code: "group.foreign-bundle",
          path: `roles.groups[${groupIndex}].bundleIds[${bundleIndex}]`,
          message: `Presentation group ${group.id} references foreign bundle ${bundleId}.`
        });
      }
    });
  });

  validateVariantReferences(input.draft, bundleById, groupById, issues);

  if (issues.length > 0) {
    return Object.freeze({
      status: "invalid",
      issues: Object.freeze(issues.map((issue) => Object.freeze(issue)))
    });
  }

  // The nominal cast is confined to this total validator; consumers cannot
  // reconstruct the private authority carried by the return type.
  return Object.freeze({
    status: "verified",
    plan: clonePlan(input.draft) as KpVerifiedOperationPresentationPlan
  });
}

function requireUniqueInventory(
  selectorIds: readonly string[],
  issues: KpOperationPresentationPlanValidationIssue[]
): void {
  const seen = new Set<string>();
  selectorIds.forEach((selectorId, index) => {
    if (selectorId.trim().length === 0 || seen.has(selectorId)) {
      issues.push({
        code: "selector.invalid-inventory",
        path: `expectedSelectorIds[${index}]`,
        selectorId,
        message:
          "Expected selector inventory must contain unique, non-empty ids."
      });
    }
    seen.add(selectorId);
  });
}

function validateIds(
  draft: KpOperationPresentationPlanDraft,
  issues: KpOperationPresentationPlanValidationIssue[]
): void {
  for (const [path, value] of [
    ["id", draft.id],
    ["transformationId", draft.transformationId]
  ] as const) {
    if (value.trim().length === 0) {
      issues.push({
        code: "plan.invalid-id",
        path,
        message: `Operation presentation plan ${path} must not be empty.`
      });
    }
  }
}

function validateVariantReferences(
  draft: KpOperationPresentationPlanDraft,
  bundleById: ReadonlyMap<string, unknown>,
  groupById: ReadonlyMap<string, KpOperationPresentationGroup>,
  issues: KpOperationPresentationPlanValidationIssue[]
): void {
  const requireBundle = (bundleId: string, path: string): void => {
    if (!bundleById.has(bundleId)) {
      issues.push({
        code: "plan.foreign-bundle",
        path,
        message: `Presentation plan references foreign bundle ${bundleId}.`
      });
    }
  };
  const requireGroup = (
    groupId: string,
    groupKind: KpOperationPresentationGroup["groupKind"],
    path: string
  ): void => {
    const group = groupById.get(groupId);
    if (group === undefined) {
      issues.push({
        code: "plan.foreign-group",
        path,
        message: `Presentation plan references foreign group ${groupId}.`
      });
    } else if (group.groupKind !== groupKind) {
      issues.push({
        code: "plan.group-kind",
        path,
        message:
          `Presentation group ${groupId} is ${group.groupKind}, expected ` +
          `${groupKind}.`
      });
    }
  };

  switch (draft.kind) {
    case "inverse-cancellation":
      requireGroup(draft.contactGroupId, "contact", "contactGroupId");
      draft.inverseBundleIds.forEach((id, index) => {
        requireBundle(id, `inverseBundleIds[${index}]`);
      });
      break;
    case "successor-synthesis":
    case "factoring":
      requireGroup(draft.fusionGroupId, "fusion", "fusionGroupId");
      requireBundle(draft.resultBundleId, "resultBundleId");
      break;
    case "synchronized-balanced-introduction":
    case "distribution":
      requireGroup(draft.branchGroupId, "branch", "branchGroupId");
      break;
    case "fraction-material":
      requireGroup(
        draft.materialGroupId,
        draft.operation,
        "materialGroupId"
      );
      break;
    case "structural-succession":
      requireBundle(draft.sourceBundleId, "sourceBundleId");
      requireBundle(draft.targetBundleId, "targetBundleId");
      break;
  }
}

function clonePlan(
  draft: KpOperationPresentationPlanDraft
): KpOperationPresentationPlanDraft {
  return Object.freeze({
    ...draft,
    roles: cloneRoles(draft.roles)
  });
}

function cloneRoles(
  roles: KpOperationPresentationRoles
): KpOperationPresentationRoles {
  return Object.freeze({
    kind: "operation-presentation-roles",
    bundles: Object.freeze(roles.bundles.map((bundle) => Object.freeze({
      ...bundle,
      semanticEntityIds: Object.freeze([...bundle.semanticEntityIds])
    }))),
    groups: Object.freeze(roles.groups.map((group) => Object.freeze({
      ...group,
      bundleIds: Object.freeze([...group.bundleIds])
    })))
  });
}
