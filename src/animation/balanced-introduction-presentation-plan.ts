import type {
  KpEquationOperationChoreography,
  KpSynchronizedBalancedIntroductionChoreography
} from "./equation-operation-choreography.ts";
import {
  kpCoreOperationPresentationLawIds
} from "./operation-presentation-law-types.ts";
import {
  runKpOperationPresentationLaws
} from "./operation-presentation-laws.ts";
import type {
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  validateAndMintKpOperationPresentationPlan
} from "./operation-presentation-plan-validator.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "./operation-presentation-roles.ts";

export type KpRegisteredEquationOperationChoreography =
  KpEquationOperationChoreography & {
    readonly operationPresentationPlan?:
      KpVerifiedOperationPresentationPlan | undefined;
  };

export function compileKpBalancedIntroductionPresentationPlan(
  choreography: KpSynchronizedBalancedIntroductionChoreography
): KpVerifiedOperationPresentationPlan {
  requireAtomicTogetherSchedule(choreography);
  const branches = choreography.branchSchedule.operation.branches;
  const branchBundles = branches.map((branch) =>
    createKpOperationPresentationBundle({
      id: `${choreography.id}.bundle.branch.${branch.id}`,
      role: "target-material",
      semanticEntityIds: branch.entityIds
    })
  );
  const branchGroup = createKpOperationPresentationGroup({
    id: `${choreography.id}.group.branch`,
    groupKind: "branch",
    bundleIds: branchBundles.map(({ id }) => id)
  });
  const targetSelectorIds = branches.flatMap(({ entityIds }) => entityIds);
  requireSameSet(
    targetSelectorIds,
    choreography.semanticEntityIds,
    choreography.id
  );
  const validation = validateAndMintKpOperationPresentationPlan({
    draft: {
      schemaVersion: "kp.verified-operation-presentation-plan.v1",
      id: `operation-presentation.${choreography.id}`,
      transformationId: choreography.transformationId,
      planKind: "synchronized-balanced-introduction",
      roles: createKpOperationPresentationRoles({
        bundles: branchBundles,
        groups: [branchGroup]
      }),
      branchGroupId: branchGroup.id
    },
    expectedSelectorIds: targetSelectorIds
  });
  if (validation.status !== "verified") {
    throw new Error(
      validation.issues.map(({ path, message }) =>
        `${path}: ${message}`
      ).join("\n")
    );
  }
  const diagnostics = runKpOperationPresentationLaws({
    plan: validation.plan,
    lawIds: kpCoreOperationPresentationLawIds,
    context: {
      sourceSelectorIds: [],
      targetSelectorIds,
      scheduledGroupIds: [branchGroup.id],
      endpointSettlement: "native-source-and-target",
      rewind: "exact-semantic-inverse"
    }
  });
  if (diagnostics.length > 0) {
    throw new Error(
      diagnostics.map(({ lawId, message }) =>
        `${lawId}: ${message}`
      ).join("\n")
    );
  }
  return validation.plan;
}

function requireAtomicTogetherSchedule(
  choreography: KpSynchronizedBalancedIntroductionChoreography
): void {
  const schedule = choreography.branchSchedule;
  const first = schedule.windows[0];
  if (
    schedule.strategy.kind !== "together" ||
    first === undefined ||
    schedule.windows.length !== schedule.operation.branches.length ||
    schedule.windows.some((window) =>
      window.start !== first.start || window.end !== first.end
    )
  ) {
    throw new Error(
      `Balanced introduction ${choreography.id} requires one atomic ` +
      "together window for every semantic branch."
    );
  }
}

function requireSameSet(
  left: readonly string[],
  right: readonly string[],
  choreographyId: string
): void {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  if (
    leftSet.size !== left.length ||
    rightSet.size !== right.length ||
    leftSet.size !== rightSet.size ||
    [...leftSet].some((id) => !rightSet.has(id))
  ) {
    throw new Error(
      `Balanced introduction ${choreographyId} branch ownership must ` +
      "exactly cover its semantic entities."
    );
  }
}
