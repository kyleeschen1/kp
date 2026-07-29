import type {
  SelectorCorrespondenceRecord
} from "../semantic/correspondence.ts";
import {
  createKpOperationPresentationBundle,
  type KpOperationPresentationBundle
} from "./operation-presentation-roles.ts";

/**
 * Context classification is shared by operation-family compilers so identity,
 * structural artifacts, and unsupported relations cannot drift by exemplar.
 */
export function compileKpOperationPresentationContextBundles(input: {
  readonly transformationId: string;
  readonly records: readonly SelectorCorrespondenceRecord[];
}): readonly KpOperationPresentationBundle[] {
  return input.records.map((record, index) => {
    const { relation, sourceSelectorIds, targetSelectorIds } = record;
    if (
      (relation === "identity" || relation === "role-change") &&
      sourceSelectorIds.length === 1 &&
      targetSelectorIds.length === 1
    ) {
      return createKpOperationPresentationBundle({
        id: `${input.transformationId}.bundle.continuant.${index}`,
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
        id: `${input.transformationId}.bundle.artifact.${index}`,
        role: "artifact",
        semanticEntityIds: [
          ...sourceSelectorIds,
          ...targetSelectorIds
        ]
      });
    }
    throw new Error(
      `Operation ${input.transformationId} has unsupported context ` +
      `${record.id} (${record.relation}).`
    );
  });
}
