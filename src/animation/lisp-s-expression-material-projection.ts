import type {
  KpLispLambdaApplicationFixture,
  KpLispDerivedOccurrence
} from "../semantic/lisp-lambda-application-fixture.ts";
import type {
  KpLispListRole,
  KpLispSExpression,
  KpLispSourceSpan
} from "../semantic/lisp-semantic-model.ts";

export interface KpLispSourceMaterialToken {
  readonly id: string;
  readonly kind: "atom" | "open-paren" | "close-paren";
  readonly lexeme: string;
  readonly ownerExpressionId: string;
  readonly ownerRole: KpLispListRole | "atom";
  readonly depth: number;
  readonly source: KpLispSourceSpan;
  readonly originIds: readonly string[];
}

export interface KpLispCanonicalMaterialState {
  readonly id: "application" | "reconstructed" | "result";
  readonly nativeCode: string;
  readonly tokens: readonly KpLispSourceMaterialToken[];
}

export interface KpLispInspectionEquivalent {
  readonly id: "structure" | "binding" | "reduction";
  readonly canonicalStateId: KpLispCanonicalMaterialState["id"];
  readonly nativeCode: string;
}

export interface KpLispSourceMaterialProjection {
  readonly id: "material-projection.lisp.lambda-application";
  readonly canonicalStates: readonly KpLispCanonicalMaterialState[];
  readonly inspectionEquivalents: readonly KpLispInspectionEquivalent[];
}

export function projectKpLispLambdaSourceMaterial(
  fixture: KpLispLambdaApplicationFixture
): KpLispSourceMaterialProjection {
  const application = Object.freeze({
    id: "application" as const,
    nativeCode: fixture.semantic.sourceText,
    tokens: Object.freeze(projectSourceTokens(fixture.semantic.root))
  });
  const reconstructed = Object.freeze({
    id: "reconstructed" as const,
    nativeCode: fixture.evaluation.reconstructed.text,
    tokens: Object.freeze(projectDerivedExpressionTokens(
      fixture.evaluation.reconstructed.text,
      fixture.evaluation.occurrences
    ))
  });
  const result = Object.freeze({
    id: "result" as const,
    nativeCode: String(fixture.evaluation.result.exactInteger),
    tokens: Object.freeze([Object.freeze({
      id: fixture.evaluation.result.id,
      kind: "atom" as const,
      lexeme: String(fixture.evaluation.result.exactInteger),
      ownerExpressionId: fixture.evaluation.result.id,
      ownerRole: "atom" as const,
      depth: 0,
      source: Object.freeze({ start: 0, end: 1 }),
      originIds: Object.freeze([
        ...fixture.evaluation.result.derivedFromExpressionIds
      ])
    })])
  });

  return Object.freeze({
    id: "material-projection.lisp.lambda-application",
    canonicalStates: Object.freeze([application, reconstructed, result]),
    inspectionEquivalents: Object.freeze([
      inspection("structure", application),
      inspection("binding", application),
      inspection("reduction", reconstructed)
    ])
  });
}

function projectSourceTokens(
  expression: KpLispSExpression,
  depth = 0,
  parentId?: string,
  parentRole?: KpLispListRole
): KpLispSourceMaterialToken[] {
  if (expression.kind === "atom") {
    return [token({
      id: expression.id,
      kind: "atom",
      lexeme: expression.lexeme,
      ownerExpressionId: parentId ?? expression.id,
      ownerRole: parentRole ?? "atom",
      depth,
      source: expression.source,
      originIds: [expression.id]
    })];
  }
  return [
    token({
      id: expression.delimiters.open.id,
      kind: "open-paren",
      lexeme: "(",
      ownerExpressionId: expression.id,
      ownerRole: expression.role,
      depth,
      source: expression.delimiters.open.source,
      originIds: [expression.delimiters.open.id]
    }),
    ...expression.children.flatMap((child) => projectSourceTokens(
      child,
      depth + 1,
      expression.id,
      expression.role
    )),
    token({
      id: expression.delimiters.close.id,
      kind: "close-paren",
      lexeme: ")",
      ownerExpressionId: expression.id,
      ownerRole: expression.role,
      depth,
      source: expression.delimiters.close.source,
      originIds: [expression.delimiters.close.id]
    })
  ];
}

function projectDerivedExpressionTokens(
  nativeCode: string,
  occurrences: readonly KpLispDerivedOccurrence[]
): KpLispSourceMaterialToken[] {
  const open = nativeCode.indexOf("(");
  const close = nativeCode.lastIndexOf(")");
  let cursor = open + 1;
  const derived = occurrences.map((occurrence) => {
    const start = nativeCode.indexOf(occurrence.lexeme, cursor);
    if (start < 0) throw new Error(
      `Derived occurrence ${occurrence.id} is absent from certified native code.`
    );
    cursor = start + occurrence.lexeme.length;
    return token({
      id: occurrence.id,
      kind: "atom",
      lexeme: occurrence.lexeme,
      ownerExpressionId: "expr.reconstructed-body",
      ownerRole: "executable-form",
      depth: 1,
      source: { start, end: cursor },
      originIds: occurrence.originExpressionIds
    });
  });
  return [
    token({
      id: "delimiter.expr.reconstructed-body.open",
      kind: "open-paren",
      lexeme: "(",
      ownerExpressionId: "expr.reconstructed-body",
      ownerRole: "executable-form",
      depth: 0,
      source: { start: open, end: open + 1 },
      originIds: ["delimiter.expr.body.open"]
    }),
    ...derived,
    token({
      id: "delimiter.expr.reconstructed-body.close",
      kind: "close-paren",
      lexeme: ")",
      ownerExpressionId: "expr.reconstructed-body",
      ownerRole: "executable-form",
      depth: 0,
      source: { start: close, end: close + 1 },
      originIds: ["delimiter.expr.body.close"]
    })
  ];
}

function token(
  input: Omit<KpLispSourceMaterialToken, "source" | "originIds"> & {
    readonly source: KpLispSourceSpan;
    readonly originIds: readonly string[];
  }
): KpLispSourceMaterialToken {
  return Object.freeze({
    ...input,
    source: Object.freeze({ ...input.source }),
    originIds: Object.freeze([...input.originIds])
  });
}

function inspection(
  id: KpLispInspectionEquivalent["id"],
  canonical: KpLispCanonicalMaterialState
): KpLispInspectionEquivalent {
  return Object.freeze({
    id,
    canonicalStateId: canonical.id,
    nativeCode: canonical.nativeCode
  });
}
