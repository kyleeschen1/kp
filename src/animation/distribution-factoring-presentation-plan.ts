import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import { compileKpFactoringChoreography } from "./factoring-choreography.ts";
import {
  compileKpOperationPresentationContextBundles
} from "./operation-presentation-correspondence.ts";
import type {
  KpVerifiedOperationPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  verifyKpOperationPresentationPlan
} from "./operation-presentation-plan-verification.ts";
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
  readonly sourceSelectorKinds?: ReadonlyMap<string, string> | undefined;
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
  const contextBundles = compileKpOperationPresentationContextBundles({
    transformationId: transformation.id,
    records: records.filter(({ id }) => id !== transfer.id)
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
        resultBundleId: targetBundles[0]!.id,
        choreography: !isDistribution && input.sourceSelectorKinds !== undefined &&
          records.some(record => record.relation === "introduction")
          ? compileCompleteFactoring() : undefined
      };
  return verifyKpOperationPresentationPlan({
    draft,
    sourceSelectorIds: input.sourceSelectorIds,
    targetSelectorIds: input.targetSelectorIds,
    scheduledGroupIds: [group.id]
  });

  function compileCompleteFactoring() {
    const context = records!.filter(record => record.relation === "identity");
    const pairs = (kind: string) => context.filter(record =>
      input.sourceSelectorKinds?.get(record.sourceSelectorIds[0]!) === kind
    ).map((record, semanticIndex) => ({ sourceId: record.sourceSelectorIds[0]!,
      targetId: record.targetSelectorIds[0]!, semanticIndex }));
    const addendPairs = pairs("term"), connectorPairs = pairs("operator");
    if (addendPairs.length + connectorPairs.length !== context.length)
      throw new Error("Complete factoring requires declared addend and connector roles.");
    return compileKpFactoringChoreography({ id: `${transformation.id}.factoring-choreography`,
      factorCopyIds: transfer!.sourceSelectorIds, commonFactorId: transfer!.targetSelectorIds[0]!,
      addendPairs, connectorPairs,
      groupingArtifactIds: records!.filter(record => record.relation === "introduction").flatMap(record => record.targetSelectorIds) });
  }
}
