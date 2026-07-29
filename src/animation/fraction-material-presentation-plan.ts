import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  compileKpOperationPresentationContextBundles
} from "./operation-presentation-correspondence.ts";
import type {
  KpVerifiedFractionMaterialPresentationPlan
} from "./operation-presentation-plan-types.ts";
import {
  verifyKpOperationPresentationPlan
} from "./operation-presentation-plan-verification.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "./operation-presentation-roles.ts";

const splitDefinitionId =
  "definition.symbolic.algebra.split-fraction-sum";
const mergeDefinitionId =
  "definition.symbolic.algebra.merge-fractions";

/**
 * The fraction split/merge compiler groups every structural fan-out or fan-in
 * into one atomic material event. It reads semantic correspondence only; the
 * existing linear-rearrangement compositor still owns paths and timing.
 */
export function compileKpFractionMaterialPresentationPlan(input: {
  readonly transformation: KpSemanticTransformation;
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
}): KpVerifiedFractionMaterialPresentationPlan | undefined {
  const { transformation } = input;
  const operation =
    transformation.transformType === "splitFractionSum" &&
    transformation.definitionId === splitDefinitionId
      ? "fission"
      : transformation.transformType === "mergeFractions" &&
          transformation.definitionId === mergeDefinitionId
        ? "fusion"
        : undefined;
  if (operation === undefined) return undefined;
  const records = transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(
      `Fraction ${operation} ${transformation.id} requires correspondence.`
    );
  }
  const relation = operation === "fission" ? "fan-out" : "fan-in";
  const transfers = records.filter(
    ({ relation: candidate }) =>
      candidate === "fan-out" || candidate === "fan-in"
  );
  if (
    transfers.length === 0 ||
    transfers.some((record) =>
      record.relation !== relation ||
      (operation === "fission"
        ? record.sourceSelectorIds.length !== 1 ||
          record.targetSelectorIds.length < 2
        : record.sourceSelectorIds.length < 2 ||
          record.targetSelectorIds.length !== 1)
    )
  ) {
    throw new Error(
      `Fraction ${operation} ${transformation.id} requires total ${relation} ` +
      "material records."
    );
  }
  const sourceBundles = transfers.map((record, index) =>
    createKpOperationPresentationBundle({
      id: `${transformation.id}.bundle.source-material.${index}`,
      role: "source-material",
      semanticEntityIds: record.sourceSelectorIds
    })
  );
  const targetBundles = transfers.map((record, index) =>
    createKpOperationPresentationBundle({
      id: `${transformation.id}.bundle.target-material.${index}`,
      role: "target-material",
      semanticEntityIds: record.targetSelectorIds
    })
  );
  const contexts = compileKpOperationPresentationContextBundles({
    transformationId: transformation.id,
    records: records.filter(
      (record) => !transfers.includes(record)
    )
  });
  const group = createKpOperationPresentationGroup({
    id: `${transformation.id}.group.${operation}`,
    groupKind: operation,
    bundleIds: [
      ...sourceBundles.map(({ id }) => id),
      ...targetBundles.map(({ id }) => id)
    ]
  });
  const plan = verifyKpOperationPresentationPlan({
    draft: {
      schemaVersion: "kp.verified-operation-presentation-plan.v1",
      id: `operation-presentation.${transformation.id}`,
      transformationId: transformation.id,
      planKind: "fraction-material",
      operation,
      roles: createKpOperationPresentationRoles({
        bundles: [...sourceBundles, ...targetBundles, ...contexts],
        groups: [group]
      }),
      materialGroupId: group.id
    },
    sourceSelectorIds: input.sourceSelectorIds,
    targetSelectorIds: input.targetSelectorIds,
    scheduledGroupIds: [group.id]
  });
  if (plan.planKind !== "fraction-material") {
    throw new Error(`Fraction ${transformation.id} compiled the wrong plan.`);
  }
  return plan;
}
