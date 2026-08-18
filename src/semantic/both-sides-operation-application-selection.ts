import type { KpSemanticTransformation } from "./asset-transformation.ts";
import type {
  KpBothSidesOperationRegistration
} from "./both-sides-operation-registration.ts";

export function selectKpBothSidesApplicationEntityIds(input: {
  readonly transformation: KpSemanticTransformation;
  readonly registration: KpBothSidesOperationRegistration;
}): readonly string[] {
  const records = input.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error(
      `Registered both-sides caller ${input.transformation.id} lacks correspondence authority.`
    );
  }
  const selection = input.registration.applicationSelection;
  const entityIds = selection.kind === "introduced-targets"
    ? records.filter(({ relation }) => relation === "introduction")
        .flatMap(({ targetSelectorIds }) => targetSelectorIds)
    : selection.recordIds.flatMap((recordId) => {
        const record = records.find(({ id }) => id === recordId);
        if (record === undefined) {
          throw new Error(
            `Registered both-sides caller ${input.transformation.id} lacks application correspondence ${recordId}.`
          );
        }
        return [...record.sourceSelectorIds, ...record.targetSelectorIds];
      });
  if (
    entityIds.length === 0 ||
    entityIds.some((id) => id.trim().length === 0) ||
    new Set(entityIds).size !== entityIds.length
  ) {
    throw new Error(
      `Registered both-sides caller ${input.transformation.id} has incomplete application correspondence.`
    );
  }
  return Object.freeze(entityIds);
}
