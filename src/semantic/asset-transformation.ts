import {
  findKpAssetSelector,
  type KpAssetBundle
} from "./asset.ts";

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

export interface KpSemanticTransformation {
  readonly id: string;
  readonly kind: "semantic-transformation";
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
  readonly correspondence: readonly KpSelectorCorrespondence[];
  readonly assumptions?: readonly string[] | undefined;
  readonly lawRefs?: readonly KpTransformationLawRef[] | undefined;
}

export interface CreateKpSemanticTransformationInput {
  readonly id: string;
  readonly transformType: string;
  readonly title: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
  readonly correspondence?: readonly KpSelectorCorrespondence[] | undefined;
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
    transformType: input.transformType,
    title: input.title,
    sourceObjectIds: [...input.sourceObjectIds],
    targetObjectIds: [...input.targetObjectIds],
    preserves: [...input.preserves],
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
