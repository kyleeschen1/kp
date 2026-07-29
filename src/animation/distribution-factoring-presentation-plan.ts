import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
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

const distributionDefinitionId =
  "definition.generated.distribution.distribute-multiplication";
const factoringDefinitionId =
  "definition.generated.distribution.factor-common-term";

/**
 * Distribution and factoring are inverse presentations of the same semantic
 * ownership transfer. This compiler reads only correspondence declarations;
 * glyph text, DOM order, and measured geometry cannot assign material roles.
 */
export function compileKpDistributionFactoringPresentationPlan(input: {
  readonly transformation: KpSemanticTransformation;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
}): KpVerifiedOperationPresentationPlan | undefined {
  const { transformation } = input;
  const operation =
    transformation.transformType === "distributeMultiplication" &&
    transformation.definitionId === distributionDefinitionId
      ? "distribution"
      : transformation.transformType === "factorCommonTerm" &&
          transformation.definitionId === factoringDefinitionId
        ? "factoring"
        : undefined;
  if (operation === undefined) {
    return undefined;
  }
  const records = transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(`${operation} ${transformation.id} needs correspondence.`);
  }
  const transfers = records.filter(
    ({ relation }) => relation === "fan-out" || relation === "fan-in"
  );
  const transfer = transfers[0];
  const isDistribution = operation === "distribution";
  if (
    transfers.length !== 1 ||
    transfer === undefined ||
    transfer.relation !== (isDistribution ? "fan-out" : "fan-in") ||
    (isDistribution
      ? transfer.sourceSelectorIds.length !== 1 ||
        transfer.targetSelectorIds.length < 2
      : transfer.sourceSelectorIds.length < 2 ||
        transfer.targetSelectorIds.length !== 1)
  ) {
    throw new Error(
      `${operation} ${transformation.id} requires exactly one total ` +
      `${isDistribution ? "fan-out" : "fan-in"} ownership transfer.`
    );
  }
  const sourceBundles = transfer.sourceSelectorIds.map((selectorId, index) =>
    createKpOperationPresentationBundle({
      id: `${transformation.id}.bundle.source-material.${index}`,
      role: "source-material",
      semanticEntityIds: [selectorId]
    })
  );
  const targetBundles = transfer.targetSelectorIds.map((selectorId, index) =>
    createKpOperationPresentationBundle({
      id: `${transformation.id}.bundle.target-material.${index}`,
      role: "target-material",
      semanticEntityIds: [selectorId]
    })
  );
  const contextBundles = records
    .filter(({ id }) => id !== transfer.id)
    .map((record, index) => {
      const { relation, sourceSelectorIds, targetSelectorIds } = record;
      if (
        (relation === "identity" || relation === "role-change") &&
        sourceSelectorIds.length === 1 &&
        targetSelectorIds.length === 1
      ) {
        return createKpOperationPresentationBundle({
          id: `${transformation.id}.bundle.continuant.${index}`,
          role: "continuant",
          semanticEntityIds: [
            sourceSelectorIds[0]!,
            targetSelectorIds[0]!
          ]
        });
      }
      if (
        (relation === "introduction" &&
          sourceSelectorIds.length === 0 &&
          targetSelectorIds.length > 0) ||
        (relation === "removal" &&
          sourceSelectorIds.length > 0 &&
          targetSelectorIds.length === 0) ||
        (relation === "artifact" &&
          sourceSelectorIds.length + targetSelectorIds.length > 0)
      ) {
        return createKpOperationPresentationBundle({
          id: `${transformation.id}.bundle.artifact.${index}`,
          role: "artifact",
          semanticEntityIds: [
            ...sourceSelectorIds,
            ...targetSelectorIds
          ]
        });
      }
      throw new Error(`${transformation.id} has unsupported context ${record.id}.`);
    });
  const groupKind: "branch" | "fusion" =
    isDistribution ? "branch" : "fusion";
  const group = createKpOperationPresentationGroup({
    id: `${transformation.id}.group.${groupKind}`,
    groupKind,
    // The group owns both sides of the transfer. A renderer therefore cannot
    // animate only a convenient descendant subset and call the event complete.
    bundleIds: [
      ...sourceBundles.map(({ id }) => id),
      ...targetBundles.map(({ id }) => id)
    ]
  });
  const roles = createKpOperationPresentationRoles({
    bundles: [...sourceBundles, ...targetBundles, ...contextBundles],
    groups: [group]
  });
  const draft = isDistribution
    ? {
        schemaVersion:
          "kp.verified-operation-presentation-plan.v1" as const,
        id: `operation-presentation.${transformation.id}`,
        transformationId: transformation.id,
        planKind: "distribution" as const,
        roles,
        branchGroupId: group.id
      }
    : {
        schemaVersion:
          "kp.verified-operation-presentation-plan.v1" as const,
        id: `operation-presentation.${transformation.id}`,
        transformationId: transformation.id,
        planKind: "factoring" as const,
        roles,
        fusionGroupId: group.id,
        resultBundleId: targetBundles[0]!.id
      };
  const validation = validateAndMintKpOperationPresentationPlan({
    draft,
    expectedSelectorIds: [
      ...input.sourceSelectorIds,
      ...input.targetSelectorIds
    ]
  });
  if (validation.status !== "verified") {
    throw new Error(validation.issues[0]!.message);
  }
  const diagnostics = runKpOperationPresentationLaws({
    plan: validation.plan,
    context: {
      sourceSelectorIds: input.sourceSelectorIds,
      targetSelectorIds: input.targetSelectorIds,
      scheduledGroupIds: [group.id],
      endpointSettlement: "native-source-and-target",
      rewind: "exact-semantic-inverse"
    }
  });
  if (diagnostics.length > 0) {
    throw new Error(diagnostics[0]!.message);
  }
  return validation.plan;
}
