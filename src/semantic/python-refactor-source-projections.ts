import type {
  KpPythonRefactorSemanticArtifactV1,
  KpPythonSemanticEntity
} from "./python-refactor-semantic-model.ts";

export const kpPythonRefactorSourceProjectionIds = [
  "projection.python.before",
  "projection.python.helper-introduced",
  "projection.python.cost-replaced",
  "projection.python.final"
] as const;

export type KpPythonRefactorSourceProjectionId =
  typeof kpPythonRefactorSourceProjectionIds[number];

export interface KpPythonProjectedEntity {
  readonly id: string;
  readonly kind: KpPythonSemanticEntity["kind"];
  readonly label: string;
  readonly sourceRange: {
    readonly startOffset: number;
    readonly endOffset: number;
  };
}

export interface KpPythonRefactorSourceProjection {
  readonly id: KpPythonRefactorSourceProjectionId;
  readonly sourceText: string;
  readonly rootEntityId?: "program.before" | "program.after";
  readonly entities: readonly KpPythonProjectedEntity[];
}

/**
 * Intermediate Python source composes complete AST-identified functions.
 * Blank-line indentation remains ordinary source layout, never moving
 * semantic material or an inferred identity system.
 */
export function createKpPythonRefactorSourceProjections(
  artifact: KpPythonRefactorSemanticArtifactV1
): readonly KpPythonRefactorSourceProjection[] {
  const before = revision(artifact, "before");
  const after = revision(artifact, "after");
  const costBefore = fragment(before, "function.shipping-cost.before");
  const messageBefore = fragment(before, "function.shipping-message.before");
  const helperAfter = fragment(after, "function.qualifies.after");
  const costAfter = fragment(after, "function.shipping-cost.after");
  const messageAfter = fragment(after, "function.shipping-message.after");

  return Object.freeze([
    projection("projection.python.before", [costBefore, messageBefore], "program.before"),
    projection("projection.python.helper-introduced", [helperAfter, costBefore, messageBefore]),
    projection("projection.python.cost-replaced", [helperAfter, costAfter, messageBefore]),
    projection("projection.python.final", [helperAfter, costAfter, messageAfter], "program.after")
  ]);
}

interface SourceFragment {
  readonly sourceText: string;
  readonly entities: readonly KpPythonProjectedEntity[];
}

function revision(
  artifact: KpPythonRefactorSemanticArtifactV1,
  id: "before" | "after"
): KpPythonRefactorSemanticArtifactV1["revisions"][number] {
  const result = artifact.revisions.find(({ revision: candidate }) => candidate === id);
  if (result === undefined) throw new Error(`Missing Python ${id} revision.`);
  return result;
}

function fragment(
  source: KpPythonRefactorSemanticArtifactV1["revisions"][number],
  functionId: string
): SourceFragment {
  const owner = source.entities.find(({ id }) => id === functionId);
  if (owner === undefined || owner.kind !== "function") {
    throw new Error(`Missing Python function entity ${functionId}.`);
  }
  const start = owner.sourceRange.startOffset;
  const end = owner.sourceRange.endOffset;
  const entities = source.entities
    .filter((entity) =>
      entity.kind !== "source-file" &&
      entity.sourceRange.startOffset >= start &&
      entity.sourceRange.endOffset <= end
    )
    .map((entity) => Object.freeze({
      id: entity.id,
      kind: entity.kind,
      label: entity.label,
      sourceRange: Object.freeze({
        startOffset: entity.sourceRange.startOffset - start,
        endOffset: entity.sourceRange.endOffset - start
      })
    }));
  return Object.freeze({
    sourceText: source.sourceText.slice(start, end),
    entities: Object.freeze(entities)
  });
}

function projection(
  id: KpPythonRefactorSourceProjectionId,
  fragments: readonly SourceFragment[],
  rootEntityId?: "program.before" | "program.after"
): KpPythonRefactorSourceProjection {
  let sourceText = "";
  const entities: KpPythonProjectedEntity[] = [];
  for (const fragment of fragments) {
    if (sourceText !== "") sourceText += "\n\n\n";
    const offset = sourceText.length;
    sourceText += fragment.sourceText;
    entities.push(...fragment.entities.map((entity) => Object.freeze({
      ...entity,
      sourceRange: Object.freeze({
        startOffset: entity.sourceRange.startOffset + offset,
        endOffset: entity.sourceRange.endOffset + offset
      })
    })));
  }
  const entityIds = entities.map(({ id: entityId }) => entityId);
  if (new Set(entityIds).size !== entityIds.length) {
    throw new Error(`Python projection ${id} contains duplicate semantic entities.`);
  }
  return Object.freeze({
    id,
    sourceText,
    ...(rootEntityId === undefined ? {} : { rootEntityId }),
    entities: Object.freeze(entities)
  });
}
