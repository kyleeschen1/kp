import type {
  KpTypeScriptRefactorSemanticArtifactV1,
  KpTypeScriptSemanticEntity
} from "./typescript-refactor-semantic-model.ts";
import {
  composeKpCompleteCodeSourceProjection,
  type KpCodeSourceFragment
} from "./code-source-projection.ts";
import {
  tokenizeKpTypeScriptSource,
  type KpTypeScriptSourceToken
} from "./typescript-source-tokens.ts";

export const kpTypeScriptRefactorSourceProjectionIds = [
  "projection.typescript.before",
  "projection.typescript.helper-introduced",
  "projection.typescript.cost-replaced",
  "projection.typescript.final"
] as const;

export type KpTypeScriptRefactorSourceProjectionId =
  typeof kpTypeScriptRefactorSourceProjectionIds[number];

export interface KpTypeScriptProjectedEntity {
  readonly id: string;
  readonly kind: KpTypeScriptSemanticEntity["kind"];
  readonly label: string;
  readonly sourceRange: {
    readonly startOffset: number;
    readonly endOffset: number;
  };
}

export interface KpTypeScriptRefactorSourceProjection {
  readonly id: KpTypeScriptRefactorSourceProjectionId;
  readonly sourceText: string;
  readonly rootEntityId?: "program.before" | "program.after" | undefined;
  readonly entities: readonly KpTypeScriptProjectedEntity[];
}

/**
 * Intermediate source is composed from compiler-identified function ranges.
 * This keeps the pedagogical edit order explicit without reparsing source or
 * promoting glyph equality into a second identity system.
 */
export function createKpTypeScriptRefactorSourceProjections(
  artifact: KpTypeScriptRefactorSemanticArtifactV1
): readonly KpTypeScriptRefactorSourceProjection[] {
  const before = revision(artifact, "before");
  const after = revision(artifact, "after");
  const costBefore = fragment(before, "function.shipping-cost.before");
  const messageBefore = fragment(before, "function.shipping-message.before");
  const helperAfter = fragment(after, "function.qualifies.after");
  const costAfter = fragment(after, "function.shipping-cost.after");
  const messageAfter = fragment(after, "function.shipping-message.after");

  return Object.freeze([
    projection(
      "projection.typescript.before",
      [costBefore, messageBefore],
      "program.before"
    ),
    projection(
      "projection.typescript.helper-introduced",
      [helperAfter, costBefore, messageBefore]
    ),
    projection(
      "projection.typescript.cost-replaced",
      [helperAfter, costAfter, messageBefore]
    ),
    projection(
      "projection.typescript.final",
      [helperAfter, costAfter, messageAfter],
      "program.after"
    )
  ]);
}

type SourceFragment = KpCodeSourceFragment<
  KpTypeScriptProjectedEntity,
  KpTypeScriptSourceToken
>;

function revision(
  artifact: KpTypeScriptRefactorSemanticArtifactV1,
  id: "before" | "after"
): KpTypeScriptRefactorSemanticArtifactV1["revisions"][number] {
  const result = artifact.revisions.find(({ revision: candidate }) => candidate === id);
  if (result === undefined) throw new Error(`Missing TypeScript ${id} revision.`);
  return result;
}

function fragment(
  source: KpTypeScriptRefactorSemanticArtifactV1["revisions"][number],
  functionId: string
): SourceFragment {
  const owner = source.entities.find(({ id }) => id === functionId);
  if (owner === undefined || owner.kind !== "function") {
    throw new Error(`Missing TypeScript function entity ${functionId}.`);
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
    entities: Object.freeze(entities),
    tokens: tokenizeKpTypeScriptSource(source.sourceText.slice(start, end))
  });
}

function projection(
  id: KpTypeScriptRefactorSourceProjectionId,
  fragments: readonly SourceFragment[],
  rootEntityId?: "program.before" | "program.after"
): KpTypeScriptRefactorSourceProjection {
  return composeKpCompleteCodeSourceProjection({
    id,
    fragments,
    separator: "\n\n",
    ...(rootEntityId === undefined ? {} : { rootEntityId })
  });
}
