export interface KpTypeScriptSemanticSourceRange {
  readonly path: string;
  readonly revisionId: string;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: { readonly line: number; readonly column: number };
  readonly end: { readonly line: number; readonly column: number };
}

export interface KpTypeScriptSemanticEntity {
  readonly id: string;
  readonly revision: "before" | "after";
  readonly kind: "source-file" | "function" | "expression" | "call-site";
  readonly label: string;
  readonly syntaxRecordId: string;
  readonly scopeId: string;
  readonly declarationId?: string | undefined;
  readonly sourceRange: KpTypeScriptSemanticSourceRange;
}

export interface KpTypeScriptRefactorSemanticArtifactV1 {
  readonly schemaVersion: "kp.typescript-refactor-semantics.v1";
  readonly contractId: "typescript-refactor.free-shipping-threshold";
  readonly revisions: readonly {
    readonly revision: "before" | "after";
    readonly path: string;
    readonly revisionId: string;
    readonly sourceText: string;
    readonly entities: readonly KpTypeScriptSemanticEntity[];
  }[];
}

export function defineKpTypeScriptRefactorSemanticArtifact(
  artifact: KpTypeScriptRefactorSemanticArtifactV1
): KpTypeScriptRefactorSemanticArtifactV1 {
  const ids = artifact.revisions.flatMap(({ entities }) =>
    entities.map(({ id }) => id)
  );
  if (new Set(ids).size !== ids.length) {
    throw new Error("TypeScript refactor semantic entity ids must be unique.");
  }
  return artifact;
}
