import type {
  KpOperationPresentationPlanDraft,
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  kpCoreOperationPresentationLawIds,
  type KpOperationPresentationLawId
} from "./operation-presentation-law-types.ts";

export {
  kpCoreOperationPresentationLawIds
} from "./operation-presentation-law-types.ts";
export type {
  KpOperationPresentationLawId
} from "./operation-presentation-law-types.ts";

export interface KpOperationPresentationLawContext {
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
  readonly scheduledGroupIds: readonly string[];
  readonly endpointSettlement:
    | "native-source-and-target"
    | "unspecified";
  readonly rewind: "exact-semantic-inverse" | "unsupported";
}

export interface KpOperationPresentationLawDiagnostic {
  readonly lawId: KpOperationPresentationLawId;
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

/**
 * Laws inspect semantic inventories and declared execution obligations only.
 * Geometry belongs to the later compositor compilation and cannot establish
 * identity, ownership, contact authority, or rewind truth.
 */
export function runKpOperationPresentationLaws(input: {
  readonly plan:
    | KpOperationPresentationPlanDraft
    | KpVerifiedOperationPresentationPlan;
  readonly context: KpOperationPresentationLawContext;
  readonly lawIds?: readonly KpOperationPresentationLawId[] | undefined;
}): readonly KpOperationPresentationLawDiagnostic[] {
  const lawIds = new Set(
    input.lawIds ?? kpCoreOperationPresentationLawIds
  );
  const diagnostics: KpOperationPresentationLawDiagnostic[] = [];
  const source = new Set(input.context.sourceSelectorIds);
  const target = new Set(input.context.targetSelectorIds);
  const expected = new Set([...source, ...target]);
  const bundleById = new Map(
    input.plan.roles.bundles.map((bundle) => [bundle.id, bundle])
  );
  const selectorOwners = new Map<string, string[]>();

  input.plan.roles.bundles.forEach((bundle) => {
    bundle.semanticEntityIds.forEach((selectorId) => {
      const owners = selectorOwners.get(selectorId) ?? [];
      selectorOwners.set(selectorId, [...owners, bundle.id]);
    });
  });

  if (lawIds.has("presentation.lineage")) {
    input.plan.roles.bundles
      .filter(({ role }) => role === "continuant")
      .forEach((bundle) => {
        const hasSource = bundle.semanticEntityIds.some((id) => source.has(id));
        const hasTarget = bundle.semanticEntityIds.some((id) => target.has(id));
        if (!hasSource || !hasTarget) {
          diagnostics.push({
            lawId: "presentation.lineage",
            code: "lineage.continuant-not-bidirectional",
            path: `roles.bundles[${bundle.id}]`,
            message:
              `Continuant bundle ${bundle.id} must own source and target ` +
              "semantic selectors."
          });
        }
      });
  }

  if (lawIds.has("presentation.ownership")) {
    expected.forEach((selectorId) => {
      const owners = selectorOwners.get(selectorId) ?? [];
      if (owners.length !== 1) {
        diagnostics.push({
          lawId: "presentation.ownership",
          code:
            owners.length === 0
              ? "ownership.missing"
              : "ownership.ambiguous",
          path: `selectors[${selectorId}]`,
          message:
            `Selector ${selectorId} requires exactly one bundle owner; ` +
            `found ${owners.length}.`
        });
      }
    });
    selectorOwners.forEach((_owners, selectorId) => {
      if (!expected.has(selectorId)) {
        diagnostics.push({
          lawId: "presentation.ownership",
          code: "ownership.foreign",
          path: `selectors[${selectorId}]`,
          message: `Bundle ownership includes foreign selector ${selectorId}.`
        });
      }
    });
  }

  if (lawIds.has("presentation.temporal-groups")) {
    const scheduled = new Set(input.context.scheduledGroupIds);
    input.plan.roles.groups.forEach((group) => {
      if (!scheduled.has(group.id)) {
        diagnostics.push({
          lawId: "presentation.temporal-groups",
          code: "temporal-group.unscheduled",
          path: `roles.groups[${group.id}]`,
          message: `Presentation group ${group.id} has no semantic schedule.`
        });
      }
    });
    scheduled.forEach((groupId) => {
      if (!input.plan.roles.groups.some(({ id }) => id === groupId)) {
        diagnostics.push({
          lawId: "presentation.temporal-groups",
          code: "temporal-group.foreign",
          path: `scheduledGroupIds[${groupId}]`,
          message: `Schedule references foreign presentation group ${groupId}.`
        });
      }
    });
  }

  if (
    lawIds.has("presentation.contacts") &&
    input.plan.planKind === "inverse-cancellation"
  ) {
    const cancellationPlan = input.plan;
    const contact = cancellationPlan.roles.groups.find(
      ({ id }) => id === cancellationPlan.contactGroupId
    );
    const actual = new Set(contact?.bundleIds ?? []);
    if (
      contact?.groupKind !== "contact" ||
      cancellationPlan.inverseBundleIds.some((id) => !actual.has(id)) ||
      actual.size !== cancellationPlan.inverseBundleIds.length
    ) {
      diagnostics.push({
        lawId: "presentation.contacts",
        code: "contact.inverse-bundles-mismatch",
        path: "contactGroupId",
        message:
          "Cancellation contact must contain exactly the two declared " +
          "inverse bundles."
      });
    }
    cancellationPlan.inverseBundleIds.forEach((bundleId) => {
      if (bundleById.get(bundleId)?.role !== "source-material") {
        diagnostics.push({
          lawId: "presentation.contacts",
          code: "contact.inverse-role-mismatch",
          path: `inverseBundleIds[${bundleId}]`,
          message:
            `Inverse bundle ${bundleId} must be classified as source material.`
        });
      }
    });
  }

  if (
    lawIds.has("presentation.endpoint-settlement") &&
    input.context.endpointSettlement !== "native-source-and-target"
  ) {
    diagnostics.push({
      lawId: "presentation.endpoint-settlement",
      code: "endpoint.native-settlement-missing",
      path: "endpointSettlement",
      message:
        "Animated presentation must settle to native source and target authority."
    });
  }

  if (
    lawIds.has("presentation.rewind") &&
    input.context.rewind !== "exact-semantic-inverse"
  ) {
    diagnostics.push({
      lawId: "presentation.rewind",
      code: "rewind.exact-inverse-missing",
      path: "rewind",
      message: "Animated presentation must declare exact semantic rewind."
    });
  }

  return Object.freeze(diagnostics.map((diagnostic) =>
    Object.freeze(diagnostic)
  ));
}
