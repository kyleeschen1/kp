import { validateCorrespondenceMap } from "../semantic/correspondence.ts";
import {
  createKpSemanticMotionCompilerRepairRequired
} from "./semantic-motion-compiler-authority.ts";
import type {
  KpSemanticMotionCompilerRepairRequiredV1,
  KpSemanticMotionCompilerRequestV1
} from "./semantic-motion-compiler-contract.ts";
import {
  assertKpVerifiedSemanticMotionEndpointFrontier,
  type KpSemanticMotionEntityAuthorityV1,
  type KpSemanticMotionSourceAuthorityV1,
  type KpVerifiedSemanticMotionEndpointFrontier
} from "./semantic-motion-endpoint-validator.ts";

export type KpSemanticMotionProvenanceKind =
  | "identity-continuant"
  | "identity-role-change"
  | "derived-merge"
  | "derived-copy"
  | "introduced"
  | "retired"
  | "retired-by-cancelation"
  | "presentation-artifact"
  | "instructional-focus";

export interface KpSemanticMotionProvenanceRecord {
  readonly correspondenceRecordId: string;
  readonly relation:
    KpSemanticMotionCompilerRequestV1["operation"]["correspondenceMap"]["records"][number]["relation"];
  readonly provenance: KpSemanticMotionProvenanceKind;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export interface KpSemanticMotionIdentityBinding {
  readonly entityId: string;
  readonly semanticIdentityId: string;
}

declare const kpSemanticMotionProvenanceAuthority: unique symbol;

export type KpVerifiedSemanticMotionProvenance = Readonly<{
  kind: "verified-semantic-motion-provenance";
  requestId: string;
  endpointFrontier: KpVerifiedSemanticMotionEndpointFrontier;
  records: readonly KpSemanticMotionProvenanceRecord[];
  identityBindings: readonly KpSemanticMotionIdentityBinding[];
  [kpSemanticMotionProvenanceAuthority]: true;
}>;

export type KpSemanticMotionCorrespondenceValidationResult =
  | {
      readonly status: "verified";
      readonly provenance: KpVerifiedSemanticMotionProvenance;
    }
  | KpSemanticMotionCompilerRepairRequiredV1;

const verifiedProvenance = new WeakSet<object>();

export function validateKpSemanticMotionCorrespondenceAndProvenance(input: {
  readonly request: KpSemanticMotionCompilerRequestV1;
  readonly source: KpSemanticMotionSourceAuthorityV1;
  readonly endpointFrontier: KpVerifiedSemanticMotionEndpointFrontier;
}): KpSemanticMotionCorrespondenceValidationResult {
  assertKpVerifiedSemanticMotionEndpointFrontier(input.endpointFrontier);
  const { request, source, endpointFrontier } = input;
  const issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][] = [];
  if (
    endpointFrontier.request !== request ||
    endpointFrontier.requestId !== request.id ||
    endpointFrontier.sourceId !== source.sourceId ||
    endpointFrontier.revisionId !== source.revisionId
  ) {
    issues.push({
      code: "semantic-motion.provenance.authority-mismatch",
      path: "$",
      message: "Endpoint/frontier authority does not belong to this request and semantic source."
    });
  }

  validateCorrespondenceMap(request.operation.correspondenceMap).forEach((issue) => issues.push({
    code: "semantic-motion.provenance.correspondence",
    path: `$.operation.correspondenceMap.${issue.path}`,
    message: issue.message
  }));
  validateTotalVisibleCoverage(request, endpointFrontier, issues);

  const sourceEntities = new Set(endpointFrontier.sourceFrontierEntityIds);
  const targetEntities = new Set(endpointFrontier.targetFrontierEntityIds);
  const authorityById = new Map(source.entities.map((entity) => [entity.id, entity] as const));
  if (authorityById.size !== source.entities.length) {
    issues.push({
      code: "semantic-motion.provenance.duplicate-entity-authority",
      path: "$.semanticSource.entities",
      message: "Semantic source repeats one or more entity authority ids."
    });
  }
  // Downstream composition must reuse validated semantic identity instead of
  // consulting a fresh source table that could disagree at a transition seam.
  const endpointEntityIds = [
    ...request.sourceState.entityIds,
    ...request.targetState.entityIds
  ];
  const identityBindings = [...new Set(endpointEntityIds)].flatMap((entityId) => {
    const authority = authorityById.get(entityId);
    if (authority === undefined) {
      requireEntityAuthority(entityId, authorityById, "$.semanticSource.entities", issues);
      return [];
    }
    return [{ entityId, semanticIdentityId: authority.semanticIdentityId }];
  });
  const provenanceRecords: KpSemanticMotionProvenanceRecord[] = [];
  request.operation.correspondenceMap.records.forEach((record, index) => {
    const path = `$.operation.correspondenceMap.records[${index}]`;
    record.sourceSelectorIds.forEach((entityId) => {
      if (!sourceEntities.has(entityId)) {
        issues.push({
          code: "semantic-motion.provenance.foreign-source",
          path: `${path}.sourceSelectorIds`,
          message: `Correspondence ${record.id} references source entity ${entityId} outside the rewrite frontier.`
        });
      }
      requireEntityAuthority(entityId, authorityById, path, issues);
    });
    record.targetSelectorIds.forEach((entityId) => {
      if (!targetEntities.has(entityId)) {
        issues.push({
          code: "semantic-motion.provenance.foreign-target",
          path: `${path}.targetSelectorIds`,
          message: `Correspondence ${record.id} references target entity ${entityId} outside the rewrite frontier.`
        });
      }
      requireEntityAuthority(entityId, authorityById, path, issues);
    });

    validateRelationProvenance({
      transformationId: request.operation.transformationId,
      record,
      authorityById,
      path,
      issues
    });
    provenanceRecords.push(Object.freeze({
      correspondenceRecordId: record.id,
      relation: record.relation,
      provenance: provenanceForRelation(record.relation),
      sourceEntityIds: Object.freeze([...record.sourceSelectorIds]),
      targetEntityIds: Object.freeze([...record.targetSelectorIds])
    }));
  });

  if (issues.length > 0) {
    return createKpSemanticMotionCompilerRepairRequired({
      requestId: request.id,
      issues,
      repairTargets: [{
        kind: "correspondence",
        targetId: request.operation.correspondenceMap.id
      }]
    });
  }
  const provenance = Object.freeze({
    kind: "verified-semantic-motion-provenance" as const,
    requestId: request.id,
    endpointFrontier,
    records: Object.freeze(provenanceRecords),
    identityBindings: Object.freeze(identityBindings.map((binding) => Object.freeze(binding)))
  }) as KpVerifiedSemanticMotionProvenance;
  verifiedProvenance.add(provenance);
  return { status: "verified", provenance };
}

function validateTotalVisibleCoverage(
  request: KpSemanticMotionCompilerRequestV1,
  endpointFrontier: KpVerifiedSemanticMotionEndpointFrontier,
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  // Artifact relations still own visible structural material; instructional
  // focus does not. Salience is validated independently in the next stage.
  const materialRecords = request.operation.correspondenceMap.records.filter(
    ({ relation }) => relation !== "focus"
  );
  for (const [side, expected] of [
    ["source", endpointFrontier.sourceFrontierEntityIds],
    ["target", endpointFrontier.targetFrontierEntityIds]
  ] as const) {
    const covered = materialRecords.flatMap((record) =>
      side === "source" ? record.sourceSelectorIds : record.targetSelectorIds
    );
    expected.forEach((entityId, index) => {
      const count = covered.filter((candidate) => candidate === entityId).length;
      if (count !== 1) {
        issues.push({
          code: count === 0
            ? "semantic-motion.provenance.incomplete-lifecycle"
            : "semantic-motion.provenance.ambiguous-lifecycle",
          path: `$.rewriteFrontier.${side}EntityIds[${index}]`,
          message:
            `Frontier ${side} entity ${entityId} must have exactly one material lifecycle relation; received ${count}.`
        });
      }
    });
  }
}

export function isKpVerifiedSemanticMotionProvenance(
  value: unknown
): value is KpVerifiedSemanticMotionProvenance {
  return typeof value === "object" && value !== null && verifiedProvenance.has(value);
}

export function assertKpVerifiedSemanticMotionProvenance(
  value: unknown
): asserts value is KpVerifiedSemanticMotionProvenance {
  if (!isKpVerifiedSemanticMotionProvenance(value)) {
    throw new Error(
      "Semantic motion compilation requires the original correspondence/provenance validator authority."
    );
  }
}

function validateRelationProvenance(input: {
  readonly transformationId: string;
  readonly record: KpSemanticMotionCompilerRequestV1["operation"]["correspondenceMap"]["records"][number];
  readonly authorityById: ReadonlyMap<string, KpSemanticMotionEntityAuthorityV1>;
  readonly path: string;
  readonly issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][];
}): void {
  const { transformationId, record, authorityById, path, issues } = input;
  if (record.relation === "identity" || record.relation === "role-change") {
    const source = authorityById.get(record.sourceSelectorIds[0]!);
    const target = authorityById.get(record.targetSelectorIds[0]!);
    if (
      source !== undefined &&
      target !== undefined &&
      (
        source.semanticIdentityId !== target.semanticIdentityId ||
        target.provenance.kind !== "identity-successor" ||
        target.provenance.transformationId !== transformationId ||
        target.provenance.sourceEntityIds[0] !== source.id
      )
    ) {
      issues.push({
        code: "semantic-motion.provenance.false-identity",
        path,
        message:
          `Correspondence ${record.id} claims identity without matching semantic identity and successor provenance.`
      });
    }
    return;
  }
  if (record.relation === "fan-in") {
    validateDerivedTargets(record.targetSelectorIds, record.sourceSelectorIds, transformationId, authorityById, path, issues);
    return;
  }
  if (record.relation === "fan-out") {
    validateDerivedTargets(record.targetSelectorIds, [record.sourceSelectorIds[0]!], transformationId, authorityById, path, issues);
    return;
  }
  if (record.relation === "introduction") {
    record.targetSelectorIds.forEach((targetId) => {
      const target = authorityById.get(targetId);
      if (
        target !== undefined &&
        (target.provenance.kind !== "introduced" ||
          target.provenance.transformationId !== transformationId)
      ) {
        issues.push({
          code: "semantic-motion.provenance.false-introduction",
          path,
          message: `Introduced target ${targetId} lacks matching transformation provenance.`
        });
      }
    });
  }
}

function validateDerivedTargets(
  targetIds: readonly string[],
  expectedSourceIds: readonly string[],
  transformationId: string,
  authorityById: ReadonlyMap<string, KpSemanticMotionEntityAuthorityV1>,
  path: string,
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  targetIds.forEach((targetId) => {
    const target = authorityById.get(targetId);
    if (
      target !== undefined &&
      (target.provenance.kind !== "derived" ||
        target.provenance.transformationId !== transformationId ||
        !sameSet(target.provenance.sourceEntityIds, expectedSourceIds))
    ) {
      issues.push({
        code: "semantic-motion.provenance.false-derivation",
        path,
        message: `Derived target ${targetId} does not name the exact semantic contributors.`
      });
    }
  });
}

function requireEntityAuthority(
  entityId: string,
  authorityById: ReadonlyMap<string, KpSemanticMotionEntityAuthorityV1>,
  path: string,
  issues: KpSemanticMotionCompilerRepairRequiredV1["issues"][number][]
): void {
  if (!authorityById.has(entityId)) {
    issues.push({
      code: "semantic-motion.provenance.missing-entity-authority",
      path,
      message: `Semantic source has no identity/provenance authority for ${entityId}.`
    });
  }
}

function provenanceForRelation(
  relation: KpSemanticMotionProvenanceRecord["relation"]
): KpSemanticMotionProvenanceKind {
  switch (relation) {
    case "identity": return "identity-continuant";
    case "role-change": return "identity-role-change";
    case "fan-in": return "derived-merge";
    case "fan-out": return "derived-copy";
    case "introduction": return "introduced";
    case "removal": return "retired";
    case "cancelation": return "retired-by-cancelation";
    case "artifact": return "presentation-artifact";
    case "focus": return "instructional-focus";
  }
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    new Set(left).size === left.length &&
    left.every((value) => right.includes(value))
  );
}
