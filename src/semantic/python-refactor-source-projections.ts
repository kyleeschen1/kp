import type {
  KpPythonRefactorSemanticArtifactV1,
  KpPythonSemanticEntity
} from "./python-refactor-semantic-model.ts";
import type { KpPythonSourceToken } from "./python-source-tokens.ts";
import {
  composeKpCompleteCodeSourceProjection,
  type KpCodeSourceFragment
} from "./code-source-projection.ts";

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
  readonly tokens: readonly KpPythonSourceToken[];
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

type SourceFragment = KpCodeSourceFragment<
  KpPythonProjectedEntity,
  KpPythonSourceToken
>;

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
  const tokens = source.tokens
    .filter((token) => token.startOffset >= start && token.endOffset <= end)
    .map((token) => Object.freeze({
      ...token,
      id: `${token.id}.${functionId}`,
      startOffset: token.startOffset - start,
      endOffset: token.endOffset - start
    }));
  return Object.freeze({
    sourceText: source.sourceText.slice(start, end),
    tokens: Object.freeze(tokens),
    entities: Object.freeze(entities)
  });
}

function projection(
  id: KpPythonRefactorSourceProjectionId,
  fragments: readonly SourceFragment[],
  rootEntityId?: "program.before" | "program.after"
): KpPythonRefactorSourceProjection {
  return composeKpCompleteCodeSourceProjection({
    id,
    fragments,
    separator: "\n\n\n",
    ...(rootEntityId === undefined ? {} : { rootEntityId }),
    tokenId: ({ id: tokenId }) => tokenId
  });
}
