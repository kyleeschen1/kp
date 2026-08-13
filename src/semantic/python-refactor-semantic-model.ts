import { assertKpCodeSourceTokenStream } from "./code-source-token-protocol.ts";

export interface KpPythonSemanticSourceRange {
  readonly path: string;
  readonly revisionId: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: { readonly line: number; readonly column: number };
  readonly end: { readonly line: number; readonly column: number };
}

export interface KpPythonSemanticEntity {
  readonly id: string;
  readonly revision: "before" | "after";
  readonly kind: "source-file" | "function" | "expression" | "call-site";
  readonly label: string;
  readonly syntaxRecordId: string;
  readonly scopeId: string;
  readonly declarationId?: string;
  readonly sourceRange: KpPythonSemanticSourceRange;
}

export interface KpPythonRefactorSemanticArtifactV1 {
  readonly schemaVersion: "kp.python-refactor-semantics.v1";
  readonly contractId: "python-refactor.free-shipping-threshold";
  readonly revisions: readonly {
    readonly revision: "before" | "after";
    readonly path: string;
    readonly revisionId: string;
    readonly sourceText: string;
    readonly tokens: readonly import("./python-source-tokens.ts").KpPythonSourceToken[];
    readonly entities: readonly KpPythonSemanticEntity[];
  }[];
}

export function defineKpPythonRefactorSemanticArtifact(
  artifact: KpPythonRefactorSemanticArtifactV1
): KpPythonRefactorSemanticArtifactV1 {
  const ids = artifact.revisions.flatMap(({ entities }) =>
    entities.map(({ id }) => id)
  );
  if (new Set(ids).size !== ids.length) {
    throw new Error("Python refactor semantic entity ids must be unique.");
  }
  for (const revision of artifact.revisions) {
    assertKpCodeSourceTokenStream(revision.sourceText, revision.tokens);
    for (const token of revision.tokens) {
      if (
        token.startOffset < 0 ||
        token.endOffset > revision.sourceText.length ||
        revision.sourceText.slice(token.startOffset, token.endOffset) !== token.text
      ) {
        throw new Error(`Python source token ${token.id} has an invalid source range.`);
      }
    }
    for (const entity of revision.entities) {
      if (
        entity.sourceRange.revisionId !== revision.revisionId ||
        entity.sourceRange.path !== revision.path ||
        entity.sourceRange.startOffset < 0 ||
        entity.sourceRange.endOffset > revision.sourceText.length ||
        entity.sourceRange.startOffset >= entity.sourceRange.endOffset
      ) {
        throw new Error(`Python semantic entity ${entity.id} has an invalid source range.`);
      }
      const source = revision.sourceText.slice(
        entity.sourceRange.startOffset,
        entity.sourceRange.endOffset
      );
      if (entity.kind !== "source-file" && source.trim().length === 0) {
        throw new Error(`Python semantic entity ${entity.id} resolves to empty source.`);
      }
    }
  }
  return artifact;
}
