import type {
  KpLispList,
  KpLispListRole,
  KpLispSemanticModel,
  KpLispSExpression
} from "../semantic/lisp-semantic-model.ts";

export interface KpLispExpressionBeadPart {
  readonly expressionId: string;
  readonly nativeCode: string;
}

export interface KpLispExpressionBeadParticle {
  readonly id: string;
  readonly childExpressionId: string;
  readonly kind: "atom" | "expression";
  readonly nativeCode: string;
  readonly aggregatesSubtree: boolean;
  readonly originExpressionIds: readonly string[];
}

export type KpLispExpressionBeadFace =
  | {
    readonly kind: "literal-head";
    readonly materialId: string;
    readonly nativeCode: string;
  }
  | {
    readonly kind: "anonymous-application-miniature";
    readonly parts: readonly KpLispExpressionBeadPart[];
  }
  | {
    readonly kind: "collection-miniature";
    readonly parts: readonly KpLispExpressionBeadPart[];
  };

export interface KpLispExpressionBead {
  readonly id: string;
  readonly expressionId: string;
  readonly role: KpLispListRole;
  readonly nativeCode: string;
  readonly face: KpLispExpressionBeadFace;
  readonly particles: readonly KpLispExpressionBeadParticle[];
  readonly originExpressionIds: readonly string[];
  readonly detailVisibility: "active-containment-only";
}

export function projectKpLispExpressionBeads(
  semantic: KpLispSemanticModel
): readonly KpLispExpressionBead[] {
  return Object.freeze(collectLists(semantic.root).map((expression) => {
    const particles = expression.children.map((child) => Object.freeze({
      id: `particle.${expression.id}.${child.id}`,
      childExpressionId: child.id,
      kind: child.kind === "atom" ? "atom" as const : "expression" as const,
      nativeCode: sourceCode(semantic, child),
      aggregatesSubtree: child.kind === "list",
      originExpressionIds: Object.freeze(collectOriginIds(child))
    }));
    return Object.freeze({
      id: `bead.${expression.id}`,
      expressionId: expression.id,
      role: expression.role,
      nativeCode: sourceCode(semantic, expression),
      face: projectFace(semantic, expression),
      particles: Object.freeze(particles),
      originExpressionIds: Object.freeze(collectOriginIds(expression)),
      detailVisibility: "active-containment-only" as const
    });
  }));
}

export function resolveKpLispExpressionBead(
  beads: readonly KpLispExpressionBead[],
  expressionId: string
): KpLispExpressionBead {
  const bead = beads.find((candidate) => candidate.expressionId === expressionId);
  if (bead === undefined) {
    throw new Error(`Unknown certified Lisp bead ${expressionId}.`);
  }
  return bead;
}

function projectFace(
  semantic: KpLispSemanticModel,
  expression: KpLispList
): KpLispExpressionBeadFace {
  if (expression.role === "executable-form") {
    const head = expression.children[0];
    if (head?.kind !== "atom") {
      throw new Error(
        `Executable bead ${expression.id} requires a certified literal head.`
      );
    }
    return Object.freeze({
      kind: "literal-head" as const,
      materialId: head.id,
      nativeCode: sourceCode(semantic, head)
    });
  }
  const parts = Object.freeze(expression.children.map((child) => Object.freeze({
    expressionId: child.id,
    nativeCode: sourceCode(semantic, child)
  })));
  return Object.freeze(expression.role === "anonymous-application"
    ? { kind: "anonymous-application-miniature" as const, parts }
    : { kind: "collection-miniature" as const, parts });
}

function collectLists(expression: KpLispSExpression): KpLispList[] {
  if (expression.kind === "atom") return [];
  return [
    ...expression.children.flatMap(collectLists),
    expression
  ];
}

function collectOriginIds(expression: KpLispSExpression): string[] {
  return [
    expression.id,
    ...(expression.kind === "list"
      ? expression.children.flatMap(collectOriginIds)
      : [])
  ];
}

function sourceCode(
  semantic: KpLispSemanticModel,
  expression: KpLispSExpression
): string {
  const nativeCode = semantic.sourceText.slice(
    expression.source.start,
    expression.source.end
  );
  if (nativeCode.length === 0) {
    throw new Error(`Lisp material ${expression.id} has no certified source text.`);
  }
  return nativeCode;
}
