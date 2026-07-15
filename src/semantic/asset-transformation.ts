import {
  findKpAssetSelector,
  type KpAssetBundle
} from "./asset.ts";
import {
  cloneCorrespondenceMap,
  type CorrespondenceMap
} from "./correspondence.ts";

export type KpTransformationPreservation =
  | "identity"
  | "structure"
  | "value"
  | "role"
  | "presentation";

export type KpLawCheckLevel =
  | "strict"
  | "sampled"
  | "lax"
  | "lossy"
  | "qualitative";

export interface KpTransformationLawRef {
  readonly id: string;
  readonly level: KpLawCheckLevel;
  readonly summary?: string | undefined;
}

export interface KpSelectorCorrespondence {
  readonly sourceSelectorId: string;
  readonly targetSelectorId: string;
  readonly preserves: readonly KpTransformationPreservation[];
  readonly summary?: string | undefined;
}

export interface KpSelectorCorrespondenceTemplate {
  readonly sourceObjectRole: string;
  readonly sourceSelectorRole: string;
  readonly targetObjectRole: string;
  readonly targetSelectorRole: string;
  readonly preserves: readonly KpTransformationPreservation[];
  readonly summary?: string | undefined;
}

export interface KpSemanticTransformation {
  readonly id: string;
  readonly kind: "semantic-transformation";
  readonly definitionId?: string | undefined;
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
  /** Rich lifecycle relations; the pair list remains a compatibility shorthand. */
  readonly correspondenceMap?: CorrespondenceMap | undefined;
  readonly correspondence: readonly KpSelectorCorrespondence[];
  readonly assumptions?: readonly string[] | undefined;
  readonly lawRefs?: readonly KpTransformationLawRef[] | undefined;
}

export interface KpSemanticTransformationDefinition {
  readonly id: string;
  readonly kind: "semantic-transformation-definition";
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectRoles: readonly string[];
  readonly targetObjectRoles: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
  readonly correspondenceTemplates: readonly KpSelectorCorrespondenceTemplate[];
  readonly assumptions?: readonly string[] | undefined;
  readonly lawRefs?: readonly KpTransformationLawRef[] | undefined;
}

export interface CreateKpSemanticTransformationInput {
  readonly id: string;
  readonly definitionId?: string | undefined;
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
  readonly correspondenceMap?: CorrespondenceMap | undefined;
  readonly correspondence?: readonly KpSelectorCorrespondence[] | undefined;
  readonly assumptions?: readonly string[] | undefined;
  readonly lawRefs?: readonly KpTransformationLawRef[] | undefined;
}

export interface CreateKpSemanticTransformationDefinitionInput {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectRoles: readonly string[];
  readonly targetObjectRoles: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
  readonly correspondenceTemplates?: readonly KpSelectorCorrespondenceTemplate[] | undefined;
  readonly assumptions?: readonly string[] | undefined;
  readonly lawRefs?: readonly KpTransformationLawRef[] | undefined;
}

export interface KpTransformationValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpSemanticTransformation(
  input: CreateKpSemanticTransformationInput
): KpSemanticTransformation {
  assertNonEmpty(input.id, "Semantic transformation id");
  assertNonEmpty(input.transformType, `Semantic transformation ${input.id} type`);
  assertNonEmpty(input.title, `Semantic transformation ${input.id} title`);

  if (input.sourceObjectIds.length === 0) {
    throw new Error(`Semantic transformation ${input.id} must have a source.`);
  }

  if (input.targetObjectIds.length === 0) {
    throw new Error(`Semantic transformation ${input.id} must have a target.`);
  }

  return {
    id: input.id,
    kind: "semantic-transformation",
    ...(input.definitionId === undefined
      ? {}
      : { definitionId: input.definitionId }),
    transformType: input.transformType,
    title: input.title,
    sourceObjectIds: [...input.sourceObjectIds],
    targetObjectIds: [...input.targetObjectIds],
    preserves: [...input.preserves],
    ...(input.correspondenceMap === undefined
      ? {}
      : { correspondenceMap: cloneCorrespondenceMap(input.correspondenceMap) }),
    correspondence: (input.correspondence ?? []).map((correspondence) => ({
      sourceSelectorId: correspondence.sourceSelectorId,
      targetSelectorId: correspondence.targetSelectorId,
      preserves: [...correspondence.preserves],
      ...(correspondence.summary === undefined
        ? {}
        : { summary: correspondence.summary })
    })),
    ...(input.assumptions === undefined
      ? {}
      : { assumptions: [...input.assumptions] }),
    ...(input.lawRefs === undefined
      ? {}
      : {
          lawRefs: input.lawRefs.map((lawRef) => ({
            id: lawRef.id,
            level: lawRef.level,
            ...(lawRef.summary === undefined ? {} : { summary: lawRef.summary })
          }))
        })
  };
}

export function createKpSemanticTransformationDefinition(
  input: CreateKpSemanticTransformationDefinitionInput
): KpSemanticTransformationDefinition {
  assertNonEmpty(input.id, "Semantic transformation definition id");
  assertNonEmpty(
    input.transformType,
    `Semantic transformation definition ${input.id} type`
  );
  assertNonEmpty(input.title, `Semantic transformation definition ${input.id} title`);

  if (input.sourceObjectRoles.length === 0) {
    throw new Error(`Semantic transformation definition ${input.id} must have a source role.`);
  }

  if (input.targetObjectRoles.length === 0) {
    throw new Error(`Semantic transformation definition ${input.id} must have a target role.`);
  }

  return {
    id: input.id,
    kind: "semantic-transformation-definition",
    transformType: input.transformType,
    title: input.title,
    sourceObjectRoles: [...input.sourceObjectRoles],
    targetObjectRoles: [...input.targetObjectRoles],
    preserves: [...input.preserves],
    correspondenceTemplates: (input.correspondenceTemplates ?? []).map(
      (correspondence) => ({
        sourceObjectRole: correspondence.sourceObjectRole,
        sourceSelectorRole: correspondence.sourceSelectorRole,
        targetObjectRole: correspondence.targetObjectRole,
        targetSelectorRole: correspondence.targetSelectorRole,
        preserves: [...correspondence.preserves],
        ...(correspondence.summary === undefined
          ? {}
          : { summary: correspondence.summary })
      })
    ),
    ...(input.assumptions === undefined
      ? {}
      : { assumptions: [...input.assumptions] }),
    ...(input.lawRefs === undefined
      ? {}
      : {
          lawRefs: input.lawRefs.map((lawRef) => ({
            id: lawRef.id,
            level: lawRef.level,
            ...(lawRef.summary === undefined ? {} : { summary: lawRef.summary })
          }))
        })
  };
}

export function validateKpSemanticTransformation(
  transformation: KpSemanticTransformation,
  bundle: KpAssetBundle
): readonly KpTransformationValidationIssue[] {
  const issues: KpTransformationValidationIssue[] = [];
  const objectIds = new Set(bundle.objects.map((object) => object.id));

  transformation.sourceObjectIds.forEach((objectId, index) => {
    if (!objectIds.has(objectId)) {
      issues.push({
        path: `sourceObjectIds[${index}]`,
        message: `Transformation ${transformation.id} references missing source object ${objectId}.`
      });
    }
  });

  transformation.targetObjectIds.forEach((objectId, index) => {
    if (!objectIds.has(objectId)) {
      issues.push({
        path: `targetObjectIds[${index}]`,
        message: `Transformation ${transformation.id} references missing target object ${objectId}.`
      });
    }
  });

  transformation.correspondence.forEach((correspondence, index) => {
    if (findKpAssetSelector(bundle, correspondence.sourceSelectorId) === undefined) {
      issues.push({
        path: `correspondence[${index}].sourceSelectorId`,
        message: `Transformation ${transformation.id} references missing source selector ${correspondence.sourceSelectorId}.`
      });
    }

    if (findKpAssetSelector(bundle, correspondence.targetSelectorId) === undefined) {
      issues.push({
        path: `correspondence[${index}].targetSelectorId`,
        message: `Transformation ${transformation.id} references missing target selector ${correspondence.targetSelectorId}.`
      });
    }
  });

  transformation.correspondenceMap?.records.forEach((record, recordIndex) => {
    record.sourceSelectorIds.forEach((selectorId, selectorIndex) => {
      if (findKpAssetSelector(bundle, selectorId) === undefined) {
        issues.push({
          path: `correspondenceMap.records[${recordIndex}].sourceSelectorIds[${selectorIndex}]`,
          message: `Transformation ${transformation.id} references missing rich-correspondence source selector ${selectorId}.`
        });
      }
    });

    record.targetSelectorIds.forEach((selectorId, selectorIndex) => {
      if (findKpAssetSelector(bundle, selectorId) === undefined) {
        issues.push({
          path: `correspondenceMap.records[${recordIndex}].targetSelectorIds[${selectorIndex}]`,
          message: `Transformation ${transformation.id} references missing rich-correspondence target selector ${selectorId}.`
        });
      }
    });
  });

  return issues;
}

export function normalizeKpSemanticTransformationCorrespondence(
  transformation: KpSemanticTransformation
): CorrespondenceMap {
  const richMap = transformation.correspondenceMap === undefined
    ? {
        id: `${transformation.id}.correspondence`,
        records: []
      }
    : cloneCorrespondenceMap(transformation.correspondenceMap);
  const records = [...richMap.records];

  transformation.correspondence.forEach((pair, index) => {
    const sameRelation = records.some((record) =>
      record.sourceSelectorIds.includes(pair.sourceSelectorId) &&
      record.targetSelectorIds.includes(pair.targetSelectorId)
    );
    const endpointsHaveLifecycles = records.some((record) =>
      record.sourceSelectorIds.includes(pair.sourceSelectorId)
    ) && records.some((record) =>
      record.targetSelectorIds.includes(pair.targetSelectorId)
    );
    const alreadyRepresented = sameRelation || endpointsHaveLifecycles;
    if (alreadyRepresented) return;

    // Legacy pairs imply persistence; absence of role preservation narrows that
    // persistence to an explicit semantic role change.
    const relation = pair.preserves.includes("role") ? "identity" : "role-change";
    records.push({
      id: `legacy.${index}.${correspondenceRecordIdPart(pair.sourceSelectorId)}.to.${correspondenceRecordIdPart(pair.targetSelectorId)}`,
      relation,
      sourceSelectorIds: [pair.sourceSelectorId],
      targetSelectorIds: [pair.targetSelectorId],
      summary: pair.summary ??
        `Legacy selector correspondence from ${pair.sourceSelectorId} to ${pair.targetSelectorId}.`
    });
  });

  return {
    id: richMap.id,
    records
  };
}

export function validateKpSemanticTransformationDefinition(
  definition: KpSemanticTransformationDefinition
): readonly KpTransformationValidationIssue[] {
  const issues: KpTransformationValidationIssue[] = [];
  const sourceObjectRoles = new Set(definition.sourceObjectRoles);
  const targetObjectRoles = new Set(definition.targetObjectRoles);

  definition.sourceObjectRoles.forEach((role, index) => {
    if (role.trim().length === 0) {
      issues.push({
        path: `sourceObjectRoles[${index}]`,
        message: `Transformation definition ${definition.id} has an empty source object role.`
      });
    }
  });

  definition.targetObjectRoles.forEach((role, index) => {
    if (role.trim().length === 0) {
      issues.push({
        path: `targetObjectRoles[${index}]`,
        message: `Transformation definition ${definition.id} has an empty target object role.`
      });
    }
  });

  definition.correspondenceTemplates.forEach((correspondence, index) => {
    if (!sourceObjectRoles.has(correspondence.sourceObjectRole)) {
      issues.push({
        path: `correspondenceTemplates[${index}].sourceObjectRole`,
        message: `Transformation definition ${definition.id} references missing source object role ${correspondence.sourceObjectRole}.`
      });
    }

    if (!targetObjectRoles.has(correspondence.targetObjectRole)) {
      issues.push({
        path: `correspondenceTemplates[${index}].targetObjectRole`,
        message: `Transformation definition ${definition.id} references missing target object role ${correspondence.targetObjectRole}.`
      });
    }
  });

  return issues;
}

export function canSequenceKpSemanticTransformations(
  left: KpSemanticTransformation,
  right: KpSemanticTransformation
): boolean {
  return stringArraysEqual(left.targetObjectIds, right.sourceObjectIds);
}

function stringArraysEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function correspondenceRecordIdPart(selectorId: string): string {
  return selectorId.replace(/[^a-zA-Z0-9_-]+/g, "-");
}
