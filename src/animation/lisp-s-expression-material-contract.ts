import {
  KP_LISP_LIST_ROLES,
  type KpLispListRole
} from "../semantic/lisp-semantic-model.ts";

export const KP_LISP_MATERIAL_FORM_ROLES = Object.freeze([
  ...KP_LISP_LIST_ROLES,
  "atom"
] as const);

export type KpLispMaterialFormRole = KpLispListRole | "atom";

export const KP_LISP_MATERIAL_OPERATION_KINDS = Object.freeze([
  "activate",
  "fold",
  "unfold",
  "bind",
  "propagate",
  "reconstruct",
  "reduce"
] as const);

export type KpLispMaterialOperationKind =
  (typeof KP_LISP_MATERIAL_OPERATION_KINDS)[number];

export interface KpLispMaterialRoleAssignment {
  readonly expressionId: string;
  readonly role: KpLispMaterialFormRole;
}

export interface KpLispMaterialOperation {
  readonly id: string;
  readonly kind: KpLispMaterialOperationKind;
  readonly subjectId: string;
  readonly sourceIds: readonly string[];
  readonly targetIds: readonly string[];
  readonly bindingId?: string | undefined;
}

export interface KpLispMaterialProgram {
  readonly id: string;
  readonly roles: readonly KpLispMaterialRoleAssignment[];
  readonly operations: readonly KpLispMaterialOperation[];
}

export interface KpLispMaterialContractIssue {
  readonly path: string;
  readonly message: string;
}

export function defineKpLispMaterialProgram(
  input: KpLispMaterialProgram
): KpLispMaterialProgram {
  const program = freezeProgram(input);
  const issues = validateKpLispMaterialProgram(program);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) =>
      `${path}: ${message}`).join("\n"));
  }
  return program;
}

export function validateKpLispMaterialProgram(
  program: KpLispMaterialProgram
): readonly KpLispMaterialContractIssue[] {
  const issues: KpLispMaterialContractIssue[] = [];
  requireText(program.id, "id", issues);
  requireUnique(
    program.roles.map(({ expressionId }) => expressionId),
    "roles",
    issues
  );
  requireUnique(
    program.operations.map(({ id }) => id),
    "operations",
    issues
  );

  program.roles.forEach((assignment, index) => {
    requireText(assignment.expressionId, `roles[${index}].expressionId`, issues);
    if (!KP_LISP_MATERIAL_FORM_ROLES.includes(assignment.role)) {
      issues.push(issue(`roles[${index}].role`,
        `unsupported form role ${String(assignment.role)}`));
    }
  });
  program.operations.forEach((operation, index) => {
    const path = `operations[${index}]`;
    requireText(operation.id, `${path}.id`, issues);
    requireText(operation.subjectId, `${path}.subjectId`, issues);
    requireTextList(operation.sourceIds, `${path}.sourceIds`, issues);
    requireTextList(operation.targetIds, `${path}.targetIds`, issues);
    validateOperationShape(operation, path, issues);
  });
  return Object.freeze(issues);
}

function validateOperationShape(
  operation: KpLispMaterialOperation,
  path: string,
  issues: KpLispMaterialContractIssue[]
): void {
  const requiresBinding = operation.kind === "bind" ||
    operation.kind === "propagate";
  if (requiresBinding) {
    requireText(operation.bindingId ?? "", `${path}.bindingId`, issues);
  } else if (operation.bindingId !== undefined) {
    issues.push(issue(`${path}.bindingId`,
      `${operation.kind} must not claim lexical binding authority`));
  }

  if (operation.kind === "activate") {
    requireEmpty(operation.sourceIds, `${path}.sourceIds`, issues);
    requireEmpty(operation.targetIds, `${path}.targetIds`, issues);
    return;
  }
  if (operation.kind === "fold" || operation.kind === "unfold") {
    requireNonEmpty(operation.sourceIds, `${path}.sourceIds`, issues);
    requireExactlyOne(operation.targetIds, `${path}.targetIds`, issues);
    return;
  }
  requireNonEmpty(operation.sourceIds, `${path}.sourceIds`, issues);
  requireNonEmpty(operation.targetIds, `${path}.targetIds`, issues);
  if (operation.kind === "reduce" || operation.kind === "reconstruct") {
    requireExactlyOne(operation.targetIds, `${path}.targetIds`, issues);
  }
}

function requireTextList(
  values: readonly string[],
  path: string,
  issues: KpLispMaterialContractIssue[]
): void {
  values.forEach((value, index) => requireText(value, `${path}[${index}]`, issues));
  requireUnique(values, path, issues);
}

function requireEmpty(
  values: readonly string[],
  path: string,
  issues: KpLispMaterialContractIssue[]
): void {
  if (values.length !== 0) issues.push(issue(path, "operation requires no material endpoints"));
}

function requireNonEmpty(
  values: readonly string[],
  path: string,
  issues: KpLispMaterialContractIssue[]
): void {
  if (values.length === 0) issues.push(issue(path, "operation requires material endpoints"));
}

function requireExactlyOne(
  values: readonly string[],
  path: string,
  issues: KpLispMaterialContractIssue[]
): void {
  if (values.length !== 1) issues.push(issue(path, "operation requires exactly one target"));
}

function requireUnique(
  values: readonly string[],
  path: string,
  issues: KpLispMaterialContractIssue[]
): void {
  const seen = new Set<string>();
  values.forEach((value, index) => {
    if (seen.has(value)) issues.push(issue(`${path}[${index}]`, `duplicate id ${value}`));
    seen.add(value);
  });
}

function requireText(
  value: string,
  path: string,
  issues: KpLispMaterialContractIssue[]
): void {
  if (value.trim() === "") issues.push(issue(path, "value must not be empty"));
}

function issue(path: string, message: string): KpLispMaterialContractIssue {
  return Object.freeze({ path, message });
}

function freezeProgram(input: KpLispMaterialProgram): KpLispMaterialProgram {
  return Object.freeze({
    ...input,
    roles: Object.freeze(input.roles.map((assignment) =>
      Object.freeze({ ...assignment }))),
    operations: Object.freeze(input.operations.map((operation) =>
      Object.freeze({
        ...operation,
        sourceIds: Object.freeze([...operation.sourceIds]),
        targetIds: Object.freeze([...operation.targetIds])
      })))
  });
}
