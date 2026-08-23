import type { KpAnimationAsset } from "../animation/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";

export function listKpEquationMigrationEndpointEntityIds(input: {
  readonly animation: KpAnimationAsset;
  readonly transformation: KpSemanticTransformation;
  readonly endpoint: "source" | "target";
}): readonly string[] {
  const objectIds = input.endpoint === "source"
    ? input.transformation.sourceObjectIds
    : input.transformation.targetObjectIds;
  return Object.freeze(objectIds.flatMap((objectId) => {
    const object = input.animation.bundle.objects.find(({ id }) =>
      id === objectId);
    if (object === undefined) {
      throw new Error(
        `${input.transformation.id} references missing ${input.endpoint} object ${objectId}.`
      );
    }
    return object.selectors.map(({ id }) => id);
  }));
}

export function listKpEquationMigrationCorrespondenceEntityIds(input: {
  readonly transformation: KpSemanticTransformation;
  readonly relations: readonly string[];
  readonly endpoint: "source" | "target";
}): readonly string[] {
  const records = input.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(`${input.transformation.id} requires correspondence.`);
  }
  const ids = records
    .filter(({ relation }) => input.relations.includes(relation))
    .flatMap((record) => input.endpoint === "source"
      ? record.sourceSelectorIds
      : record.targetSelectorIds);
  return Object.freeze([...new Set(ids)]);
}

export function requireKpEquationMigrationTransformation(
  animation: KpAnimationAsset,
  transformationId: string
): KpSemanticTransformation {
  const transformation = animation.transformations.find(({ id }) =>
    id === transformationId);
  if (transformation === undefined) {
    throw new Error(`${animation.id} has no transformation ${transformationId}.`);
  }
  return transformation;
}
