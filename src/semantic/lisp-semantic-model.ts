export interface KpLispSourceSpan {
  readonly start: number;
  readonly end: number;
}

export type KpLispSExpression = KpLispAtom | KpLispList;

export interface KpLispAtom {
  readonly kind: "atom";
  readonly id: string;
  readonly atomKind: "symbol" | "integer";
  readonly lexeme: string;
  readonly source: KpLispSourceSpan;
}

export interface KpLispList {
  readonly kind: "list";
  readonly id: string;
  readonly children: readonly KpLispSExpression[];
  readonly source: KpLispSourceSpan;
}

export interface KpLispBinding {
  readonly id: string;
  readonly name: string;
  readonly binderOccurrenceId: string;
  readonly referenceOccurrenceIds: readonly string[];
  readonly scopeExpressionId: string;
}

export interface KpLispEnvironmentEntry {
  readonly bindingId: string;
  readonly valueExpressionId: string;
}

export interface KpLispEnvironment {
  readonly id: string;
  readonly parentEnvironmentId?: string | undefined;
  readonly entries: readonly KpLispEnvironmentEntry[];
}

export interface KpLispSubstitutionDestination {
  readonly kind: "substitution";
  readonly id: string;
  readonly parentExpressionId: string;
  readonly childIndex: number;
  readonly referenceOccurrenceId: string;
  readonly accepts: "s-expression";
}

export interface KpLispIntegerValue {
  readonly kind: "integer-value";
  readonly id: string;
  readonly exactInteger: number;
  readonly sourceExpressionId: string;
}

export interface KpLispSemanticModel {
  readonly id: string;
  readonly sourceText: string;
  readonly root: KpLispSExpression;
  readonly bindings: readonly KpLispBinding[];
  readonly environments: readonly KpLispEnvironment[];
  readonly destinations: readonly KpLispSubstitutionDestination[];
  readonly values: readonly KpLispIntegerValue[];
}

export interface KpLispSemanticIssue {
  readonly path: string;
  readonly message: string;
}

export function defineKpLispSemanticModel(
  input: KpLispSemanticModel
): KpLispSemanticModel {
  const model = freezeModel(input);
  const issues = validateKpLispSemanticModel(model);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join("\n"));
  }
  return model;
}

export function validateKpLispSemanticModel(
  model: KpLispSemanticModel
): readonly KpLispSemanticIssue[] {
  const issues: KpLispSemanticIssue[] = [];
  const expressions = collectKpLispExpressions(model.root);
  const expressionsById = new Map<string, KpLispSExpression>();
  const allIds = new Map<string, string>();

  requireId(model.id, "id", allIds, issues);
  validateExpression(model.root, "root", model.sourceText, undefined, expressionsById, allIds, issues);

  model.bindings.forEach((binding, index) => {
    const path = `bindings[${index}]`;
    requireId(binding.id, `${path}.id`, allIds, issues);
    requireText(binding.name, `${path}.name`, issues);
    requireAtom(binding.binderOccurrenceId, `${path}.binderOccurrenceId`, expressionsById, issues);
    requireExpression(binding.scopeExpressionId, `${path}.scopeExpressionId`, expressionsById, issues);
    if (binding.referenceOccurrenceIds.length === 0) {
      issues.push(issue(`${path}.referenceOccurrenceIds`, "binding needs a reference occurrence"));
    }
    binding.referenceOccurrenceIds.forEach((id, refIndex) =>
      requireAtom(id, `${path}.referenceOccurrenceIds[${refIndex}]`, expressionsById, issues)
    );
  });

  model.environments.forEach((environment, index) => {
    const path = `environments[${index}]`;
    requireId(environment.id, `${path}.id`, allIds, issues);
    environment.entries.forEach((entry, entryIndex) => {
      const entryPath = `${path}.entries[${entryIndex}]`;
      requireKnown(entry.bindingId, `${entryPath}.bindingId`, model.bindings, issues);
      requireExpression(entry.valueExpressionId, `${entryPath}.valueExpressionId`, expressionsById, issues);
    });
  });
  const environmentsById = new Set(model.environments.map(({ id }) => id));
  model.environments.forEach((environment, index) => {
    if (environment.parentEnvironmentId !== undefined &&
        !environmentsById.has(environment.parentEnvironmentId)) {
      issues.push(issue(
        `environments[${index}].parentEnvironmentId`,
        `unknown environment ${environment.parentEnvironmentId}`
      ));
    }
  });

  model.destinations.forEach((destination, index) => {
    const path = `destinations[${index}]`;
    requireId(destination.id, `${path}.id`, allIds, issues);
    const parent = expressionsById.get(destination.parentExpressionId);
    if (parent?.kind !== "list") {
      issues.push(issue(`${path}.parentExpressionId`, "destination parent must be a known list"));
    } else if (parent.children[destination.childIndex]?.id !== destination.referenceOccurrenceId) {
      issues.push(issue(path, "destination child does not match its reference occurrence"));
    }
    requireAtom(destination.referenceOccurrenceId, `${path}.referenceOccurrenceId`, expressionsById, issues);
  });

  model.values.forEach((value, index) => {
    const path = `values[${index}]`;
    requireId(value.id, `${path}.id`, allIds, issues);
    if (!Number.isSafeInteger(value.exactInteger)) {
      issues.push(issue(`${path}.exactInteger`, "integer value must be a safe integer"));
    }
    requireExpression(value.sourceExpressionId, `${path}.sourceExpressionId`, expressionsById, issues);
  });

  // Keep this comparison explicit: equal source glyphs are not semantic identity.
  if (expressions.length !== expressionsById.size) {
    issues.push(issue("root", "every S-expression occurrence needs a distinct id"));
  }
  return Object.freeze(issues);
}

export function collectKpLispExpressions(
  root: KpLispSExpression
): readonly KpLispSExpression[] {
  const expressions: KpLispSExpression[] = [];
  const visit = (expression: KpLispSExpression): void => {
    expressions.push(expression);
    if (expression.kind === "list") expression.children.forEach(visit);
  };
  visit(root);
  return Object.freeze(expressions);
}

function validateExpression(
  expression: KpLispSExpression,
  path: string,
  sourceText: string,
  parent: KpLispSourceSpan | undefined,
  expressionsById: Map<string, KpLispSExpression>,
  allIds: Map<string, string>,
  issues: KpLispSemanticIssue[]
): void {
  requireId(expression.id, `${path}.id`, allIds, issues);
  if (!expressionsById.has(expression.id)) expressionsById.set(expression.id, expression);
  const { start, end } = expression.source;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > sourceText.length) {
    issues.push(issue(`${path}.source`, "source span must be a non-empty range inside sourceText"));
  }
  if (parent !== undefined && (start < parent.start || end > parent.end)) {
    issues.push(issue(`${path}.source`, "child source span must be inside its parent"));
  }
  if (expression.kind === "atom") {
    requireText(expression.lexeme, `${path}.lexeme`, issues);
    if (sourceText.slice(start, end) !== expression.lexeme) {
      issues.push(issue(`${path}.source`, "atom source span must select its exact lexeme"));
    }
    if (expression.atomKind === "integer" && !/^-?\d+$/.test(expression.lexeme)) {
      issues.push(issue(`${path}.lexeme`, "integer atoms require an integer lexeme"));
    }
    return;
  }
  expression.children.forEach((child, index) =>
    validateExpression(child, `${path}.children[${index}]`, sourceText, expression.source, expressionsById, allIds, issues)
  );
}

function requireExpression(
  id: string,
  path: string,
  expressionsById: ReadonlyMap<string, KpLispSExpression>,
  issues: KpLispSemanticIssue[]
): void {
  if (!expressionsById.has(id)) issues.push(issue(path, `unknown expression ${id}`));
}

function requireAtom(
  id: string,
  path: string,
  expressionsById: ReadonlyMap<string, KpLispSExpression>,
  issues: KpLispSemanticIssue[]
): void {
  if (expressionsById.get(id)?.kind !== "atom") {
    issues.push(issue(path, `unknown atom occurrence ${id}`));
  }
}

function requireKnown(
  id: string,
  path: string,
  values: readonly { readonly id: string }[],
  issues: KpLispSemanticIssue[]
): void {
  if (!values.some((value) => value.id === id)) issues.push(issue(path, `unknown id ${id}`));
}

function requireId(
  id: string,
  path: string,
  allIds: Map<string, string>,
  issues: KpLispSemanticIssue[]
): void {
  requireText(id, path, issues);
  const previous = allIds.get(id);
  if (previous === undefined) allIds.set(id, path);
  else issues.push(issue(path, `duplicate id ${id}; first declared at ${previous}`));
}

function requireText(value: string, path: string, issues: KpLispSemanticIssue[]): void {
  if (value.trim() === "") issues.push(issue(path, "value must not be empty"));
}

function issue(path: string, message: string): KpLispSemanticIssue {
  return Object.freeze({ path, message });
}

function freezeModel(input: KpLispSemanticModel): KpLispSemanticModel {
  const freezeExpression = (expression: KpLispSExpression): KpLispSExpression =>
    expression.kind === "atom"
      ? Object.freeze({ ...expression, source: Object.freeze({ ...expression.source }) })
      : Object.freeze({
        ...expression,
        source: Object.freeze({ ...expression.source }),
        children: Object.freeze(expression.children.map(freezeExpression))
      });
  return Object.freeze({
    ...input,
    root: freezeExpression(input.root),
    bindings: Object.freeze(input.bindings.map((binding) => Object.freeze({
      ...binding,
      referenceOccurrenceIds: Object.freeze([...binding.referenceOccurrenceIds])
    }))),
    environments: Object.freeze(input.environments.map((environment) => Object.freeze({
      ...environment,
      entries: Object.freeze(environment.entries.map((entry) => Object.freeze({ ...entry })))
    }))),
    destinations: Object.freeze(input.destinations.map((destination) => Object.freeze({ ...destination }))),
    values: Object.freeze(input.values.map((value) => Object.freeze({ ...value })))
  });
}
