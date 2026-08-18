import {
  compileKpBothSidesCausalRecipe,
  type KpBothSidesCausalDirection,
  type KpBothSidesCausalRecipe
} from "./both-sides-causal-recipe.ts";
import {
  kpEquationBranchRoleForSemanticId
} from "./equation-balanced-branch-scheduling.ts";
import type {
  KpBalancedBranchScheduling
} from "./equation-balanced-branch-scheduling.ts";
import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  verifyKpBothSidesOperation,
  type KpVerifiedBothSidesOperation
} from "../semantic/both-sides-operation-family.ts";
import {
  findKpBothSidesOperationRegistration
} from "../semantic/both-sides-operation-registration.ts";

export interface KpRegisteredBothSidesCausalBinding {
  readonly registrationId: string;
  readonly operation: KpVerifiedBothSidesOperation;
  readonly recipe: KpBothSidesCausalRecipe;
}

export function compileKpRegisteredBothSidesCausalBinding(input: {
  readonly transformation: KpSemanticTransformation;
  readonly branchScheduling: KpBalancedBranchScheduling;
  readonly direction: KpBothSidesCausalDirection;
}): KpRegisteredBothSidesCausalBinding | undefined {
  const registration = findKpBothSidesOperationRegistration(
    input.transformation.transformType
  );
  if (registration === undefined) return undefined;
  const law = input.transformation.lawRefs?.find(
    ({ id, level }) => id === registration.lawId && level === "strict"
  );
  if (law === undefined) {
    throw new Error(
      `Registered both-sides caller ${input.transformation.id} lacks strict ` +
      `${registration.lawId} authority.`
    );
  }
  const records = input.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(
      `Registered both-sides caller ${input.transformation.id} lacks correspondence authority.`
    );
  }
  const relationRecord = records.find((record) =>
    record.relation === "identity" &&
    record.sourceSelectorIds.length === 1 &&
    record.targetSelectorIds.length === 1 &&
    isEqualityEntityId(record.sourceSelectorIds[0]!) &&
    isEqualityEntityId(record.targetSelectorIds[0]!)
  );
  if (relationRecord === undefined) {
    throw new Error(
      `Registered both-sides caller ${input.transformation.id} lacks equality continuity.`
    );
  }
  const sourceIds = unique(records.flatMap(({ sourceSelectorIds }) =>
    sourceSelectorIds
  ).filter((id) => !isEqualityEntityId(id)));
  const targetIds = unique(records.flatMap(({ targetSelectorIds }) =>
    targetSelectorIds
  ).filter((id) => !isEqualityEntityId(id)));
  const common = {
    schemaVersion: "kp.both-sides-operation.v1",
    id: input.transformation.id,
    relation: {
      kind: "equality",
      semanticId: "semantic.relation.equality",
      sourceEntityId: relationRecord.sourceSelectorIds[0]!,
      targetEntityId: relationRecord.targetSelectorIds[0]!
    },
    branches: {
      lhs: {
        side: "lhs",
        sourceExpressionEntityIds: branchIds(sourceIds, "lhs", input.transformation.id),
        targetExpressionEntityIds: branchIds(targetIds, "lhs", input.transformation.id),
        appliedEntityIds: branchApplicationIds(
          input.branchScheduling,
          "lhs",
          input.transformation.id
        )
      },
      rhs: {
        side: "rhs",
        sourceExpressionEntityIds: branchIds(sourceIds, "rhs", input.transformation.id),
        targetExpressionEntityIds: branchIds(targetIds, "rhs", input.transformation.id),
        appliedEntityIds: branchApplicationIds(
          input.branchScheduling,
          "rhs",
          input.transformation.id
        )
      }
    }
  } as const;
  const operandSemanticId =
    `semantic.operation-operand.${input.transformation.id}`;
  const operation = registration.operationKind === "add"
    ? verifyKpBothSidesOperation({
        ...common,
        operation: { kind: "add", operandSemanticId },
        lawAuthority: {
          id: registration.lawId,
          authorityRefId: registration.semanticAuthorityId,
          level: "strict"
        },
        domainEvidence: {
          kind: "declared-relation-domain",
          evidenceIds: registration.relationDomainEvidenceIds
        }
      })
    : verifyKpBothSidesOperation({
        ...common,
        operation: { kind: "subtract", operandSemanticId },
        lawAuthority: {
          id: registration.lawId,
          authorityRefId: registration.semanticAuthorityId,
          level: "strict"
        },
        domainEvidence: {
          kind: "declared-relation-domain",
          evidenceIds: registration.relationDomainEvidenceIds
        }
      });
  return Object.freeze({
    registrationId: registration.id,
    operation,
    recipe: compileKpBothSidesCausalRecipe({
      operation,
      direction: input.direction
    })
  });
}

function branchIds(
  ids: readonly string[],
  side: "lhs" | "rhs",
  transformationId: string
): readonly [string, ...string[]] {
  const matches = ids.filter((id) =>
    kpEquationBranchRoleForSemanticId(id) === side
  );
  if (matches.length === 0) {
    throw new Error(
      `Registered both-sides caller ${transformationId} lacks ${side} expression roles.`
    );
  }
  return matches as [string, ...string[]];
}

function branchApplicationIds(
  scheduling: KpBalancedBranchScheduling,
  side: "lhs" | "rhs",
  transformationId: string
): readonly [string, ...string[]] {
  const ids = scheduling.branchOperation.branches.find(
    ({ id }) => id === side
  )?.entityIds;
  if (ids === undefined || ids.length === 0) {
    throw new Error(
      `Registered both-sides caller ${transformationId} lacks ${side} application roles.`
    );
  }
  return ids as [string, ...string[]];
}

function isEqualityEntityId(id: string): boolean {
  const segments = new Set(id.split("."));
  return segments.has("equals") || segments.has("equality") ||
    segments.has("relation");
}

function unique(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)];
}
