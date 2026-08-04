import {
  collectKpLispExpressions,
  type KpLispSExpression,
  type KpLispSemanticModel
} from "../semantic/lisp-semantic-model.ts";

export interface KpLispMaterialRoot {
  readonly expressionId: string;
  readonly role:
    | "executable-form"
    | "parameter-list"
    | "anonymous-application"
    | "quoted-data"
    | "atom";
  readonly anchorKind: "token" | "expression" | "centroid";
  readonly anchorIds: readonly string[];
}

export function resolveKpLispMaterialRoots(
  semantic: KpLispSemanticModel
): readonly KpLispMaterialRoot[] {
  return Object.freeze(collectKpLispExpressions(semantic.root).map(
    resolveExpressionRoot
  ));
}

export function resolveKpLispMaterialRoot(
  semantic: KpLispSemanticModel,
  expressionId: string
): KpLispMaterialRoot {
  const expression = collectKpLispExpressions(semantic.root).find(
    ({ id }) => id === expressionId
  );
  if (expression === undefined) {
    throw new Error(`Unknown certified Lisp expression ${expressionId}.`);
  }
  return resolveExpressionRoot(expression);
}

function resolveExpressionRoot(
  expression: KpLispSExpression
): KpLispMaterialRoot {
  if (expression.kind === "atom") {
    return root(expression.id, "atom", "token", [expression.id]);
  }
  if (expression.role === "executable-form") {
    const operator = expression.children[0];
    if (operator?.kind !== "atom") {
      throw new Error(
        `Executable form ${expression.id} requires a certified atomic operator.`
      );
    }
    return root(expression.id, expression.role, "token", [operator.id]);
  }
  if (expression.role === "anonymous-application") {
    const operator = expression.children[0];
    if (operator === undefined) {
      throw new Error(
        `Anonymous application ${expression.id} requires a certified operator.`
      );
    }
    return root(expression.id, expression.role, "expression", [operator.id]);
  }
  if (expression.children.length === 0) {
    throw new Error(
      `${expression.role} ${expression.id} requires material for its centroid.`
    );
  }
  return root(
    expression.id,
    expression.role,
    "centroid",
    expression.children.map(({ id }) => id)
  );
}

function root(
  expressionId: string,
  role: KpLispMaterialRoot["role"],
  anchorKind: KpLispMaterialRoot["anchorKind"],
  anchorIds: readonly string[]
): KpLispMaterialRoot {
  return Object.freeze({
    expressionId,
    role,
    anchorKind,
    anchorIds: Object.freeze([...anchorIds])
  });
}
