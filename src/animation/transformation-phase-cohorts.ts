import type { KpAnimationAsset } from "./asset.ts";
import {
  semanticTransformationForwardPhases
} from "../semantic/transformation-composition.ts";

export interface KpAnimationTransformationPhaseCohort {
  readonly id: string;
  readonly transformationIds: readonly string[];
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
}

/**
 * The runtime samples parallel tree leaves together, so the reader must give
 * those leaves one shared native source/target scene instead of silently
 * choosing the first transformation.
 */
export function compileKpAnimationTransformationPhaseCohorts(
  animation: KpAnimationAsset
): readonly KpAnimationTransformationPhaseCohort[] {
  const transformations = new Map(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation
    ])
  );
  const seen = new Set<string>();
  const cohorts = semanticTransformationForwardPhases(
    animation.transformationTree.root
  ).map((transformationIds) => {
    if (transformationIds.length === 0) {
      throw new Error(`Animation ${animation.id} contains an empty phase cohort.`);
    }
    const members = transformationIds.map((transformationId) => {
      const transformation = transformations.get(transformationId);
      if (transformation === undefined) {
        throw new Error(
          `Animation ${animation.id} phase references missing transformation ${transformationId}.`
        );
      }
      if (seen.has(transformationId)) {
        throw new Error(
          `Animation ${animation.id} repeats transformation ${transformationId} across phase cohorts.`
        );
      }
      seen.add(transformationId);
      return transformation;
    });
    const first = members[0]!;
    for (const member of members.slice(1)) {
      if (
        !sameStrings(member.sourceObjectIds, first.sourceObjectIds) ||
        !sameStrings(member.targetObjectIds, first.targetObjectIds)
      ) {
        throw new Error(
          `Parallel phase ${transformationIds.join(", ")} requires one shared source and target scene.`
        );
      }
    }
    return Object.freeze({
      id: transformationIds.length === 1
        ? transformationIds[0]!
        : `cohort.${transformationIds.join("__")}`,
      transformationIds: Object.freeze([...transformationIds]),
      sourceObjectIds: Object.freeze([...first.sourceObjectIds]),
      targetObjectIds: Object.freeze([...first.targetObjectIds])
    });
  });
  const missing = animation.transformations
    .map(({ id }) => id)
    .filter((id) => !seen.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Animation ${animation.id} transformation tree omits ${missing.join(", ")}.`
    );
  }
  return Object.freeze(cohorts);
}

export function findKpAnimationTransformationPhaseCohort(input: {
  readonly cohorts: readonly KpAnimationTransformationPhaseCohort[];
  readonly transformationIds: readonly string[];
}): KpAnimationTransformationPhaseCohort | undefined {
  return input.cohorts.find((cohort) =>
    sameStrings(cohort.transformationIds, input.transformationIds)
  );
}

function sameStrings(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
