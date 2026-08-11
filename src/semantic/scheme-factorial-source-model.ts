export const KP_SCHEME_FACTORIAL_SOURCE = `(define (factorial n)
  (if (= n 0)
      1
      (* n (factorial (- n 1)))))
(factorial 3)` as const;

export interface KpSchemeSourceSpan {
  readonly start: number;
  readonly end: number;
}

export type KpSchemeSourceExpression =
  | KpSchemeSourceAtom
  | KpSchemeSourceList;

export type KpSchemeSourceAtomRole = "keyword" | "identifier" | "integer";

export type KpSchemeSourceListRole =
  | "definition"
  | "procedure-signature"
  | "conditional"
  | "application";

interface KpSchemeSourceExpressionBase {
  readonly id: string;
  readonly address: readonly number[];
  readonly source: KpSchemeSourceSpan;
}

export interface KpSchemeSourceAtom extends KpSchemeSourceExpressionBase {
  readonly kind: "atom";
  readonly atomKind: "symbol" | "integer";
  readonly role: KpSchemeSourceAtomRole;
  readonly lexeme: string;
}

export interface KpSchemeSourceDelimiter {
  readonly id: string;
  readonly kind: "open-paren" | "close-paren";
  readonly source: KpSchemeSourceSpan;
}

export interface KpSchemeSourceList extends KpSchemeSourceExpressionBase {
  readonly kind: "list";
  readonly role: KpSchemeSourceListRole;
  readonly delimiters: {
    readonly open: KpSchemeSourceDelimiter;
    readonly close: KpSchemeSourceDelimiter;
  };
  readonly children: readonly KpSchemeSourceExpression[];
}

export interface KpSchemeSourceDocument {
  readonly schemaVersion: "kp.scheme-source-document.v1";
  readonly id: string;
  readonly sourceText: string;
  readonly forms: readonly KpSchemeSourceExpression[];
}

export interface KpSchemeSourceIssue {
  readonly path: string;
  readonly message: string;
}

/** IDs follow syntax addresses so whitespace and paint geometry cannot change identity. */
export function kpSchemeSourceOccurrenceId(
  documentId: string,
  address: readonly number[]
): string {
  if (documentId.trim().length === 0 || address.length === 0 ||
      address.some((part) => !Number.isSafeInteger(part) || part < 0)) {
    throw new Error("Scheme source occurrence IDs require a document and address.");
  }
  return `${documentId}.occurrence.${address.join(".")}`;
}

export function kpSchemeSourceDelimiterId(
  occurrenceId: string,
  side: "open" | "close"
): string {
  if (occurrenceId.trim().length === 0) {
    throw new Error("Scheme delimiter IDs require an occurrence ID.");
  }
  return `${occurrenceId}.delimiter.${side}`;
}

export function defineKpSchemeSourceDocument(
  input: KpSchemeSourceDocument
): KpSchemeSourceDocument {
  const document = freezeDocument(input);
  const issues = validateKpSchemeSourceDocument(document);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) =>
      `${path}: ${message}`).join("\n"));
  }
  return document;
}

export function validateKpSchemeSourceDocument(
  document: KpSchemeSourceDocument
): readonly KpSchemeSourceIssue[] {
  const issues: KpSchemeSourceIssue[] = [];
  const ids = new Set<string>();
  if (document.schemaVersion !== "kp.scheme-source-document.v1") {
    issues.push(issue("schemaVersion", "unsupported Scheme source schema"));
  }
  if (document.id.trim().length === 0) {
    issues.push(issue("id", "document ID must not be empty"));
  }
  if (document.sourceText.length === 0) {
    issues.push(issue("sourceText", "Scheme source must not be empty"));
  }
  if (document.forms.length === 0) {
    issues.push(issue("forms", "Scheme source requires at least one form"));
  }

  let priorEnd = 0;
  document.forms.forEach((form, index) => {
    validateExpression({
      expression: form,
      expectedAddress: [index],
      path: `forms[${index}]`,
      document,
      ids,
      issues
    });
    if (form.source.start < priorEnd) {
      issues.push(issue(`forms[${index}].source`,
        "top-level forms must retain source order without overlap"));
    }
    priorEnd = Math.max(priorEnd, form.source.end);
  });
  return Object.freeze(issues);
}

export function collectKpSchemeSourceExpressions(
  document: KpSchemeSourceDocument
): readonly KpSchemeSourceExpression[] {
  const expressions: KpSchemeSourceExpression[] = [];
  const visit = (expression: KpSchemeSourceExpression): void => {
    expressions.push(expression);
    if (expression.kind === "list") expression.children.forEach(visit);
  };
  document.forms.forEach(visit);
  return Object.freeze(expressions);
}

function validateExpression(input: {
  readonly expression: KpSchemeSourceExpression;
  readonly expectedAddress: readonly number[];
  readonly path: string;
  readonly document: KpSchemeSourceDocument;
  readonly ids: Set<string>;
  readonly issues: KpSchemeSourceIssue[];
}): void {
  const { expression, expectedAddress, path, document, ids, issues } = input;
  requireUniqueId(expression.id, `${path}.id`, ids, issues);
  if (!sameAddress(expression.address, expectedAddress)) {
    issues.push(issue(`${path}.address`,
      `expected syntax address ${expectedAddress.join(".")}`));
  }
  const expectedId = kpSchemeSourceOccurrenceId(document.id, expectedAddress);
  if (expression.id !== expectedId) {
    issues.push(issue(`${path}.id`, `expected address-derived ID ${expectedId}`));
  }
  validateSpan(expression.source, `${path}.source`, document.sourceText, issues);

  if (expression.kind === "atom") {
    if (document.sourceText.slice(
      expression.source.start,
      expression.source.end
    ) !== expression.lexeme) {
      issues.push(issue(`${path}.source`, "atom span must select its lexeme"));
    }
    if (expression.lexeme.length === 0) {
      issues.push(issue(`${path}.lexeme`, "atom lexeme must not be empty"));
    }
    if (expression.atomKind === "integer") {
      if (!/^-?\d+$/.test(expression.lexeme) || expression.role !== "integer") {
        issues.push(issue(path, "integer atoms require integer syntax and role"));
      }
    } else if (expression.role === "integer") {
      issues.push(issue(`${path}.role`, "symbol atoms cannot carry integer role"));
    }
    return;
  }

  validateDelimiter({
    delimiter: expression.delimiters.open,
    side: "open",
    occurrenceId: expression.id,
    parent: expression.source,
    path: `${path}.delimiters.open`,
    sourceText: document.sourceText,
    ids,
    issues
  });
  validateDelimiter({
    delimiter: expression.delimiters.close,
    side: "close",
    occurrenceId: expression.id,
    parent: expression.source,
    path: `${path}.delimiters.close`,
    sourceText: document.sourceText,
    ids,
    issues
  });
  if (expression.delimiters.open.source.start !== expression.source.start ||
      expression.delimiters.close.source.end !== expression.source.end) {
    issues.push(issue(`${path}.delimiters`,
      "list delimiters must bound the complete source span"));
  }
  if (expression.children.length === 0) {
    issues.push(issue(`${path}.children`, "the bounded Scheme subset has no empty lists"));
  }
  let priorEnd = expression.delimiters.open.source.end;
  expression.children.forEach((child, index) => {
    const childPath = `${path}.children[${index}]`;
    if (child.source.start < priorEnd ||
        child.source.end > expression.delimiters.close.source.start) {
      issues.push(issue(`${childPath}.source`,
        "children must stay ordered inside their list delimiters"));
    }
    validateExpression({
      expression: child,
      expectedAddress: [...expectedAddress, index],
      path: childPath,
      document,
      ids,
      issues
    });
    priorEnd = Math.max(priorEnd, child.source.end);
  });
}

function validateDelimiter(input: {
  readonly delimiter: KpSchemeSourceDelimiter;
  readonly side: "open" | "close";
  readonly occurrenceId: string;
  readonly parent: KpSchemeSourceSpan;
  readonly path: string;
  readonly sourceText: string;
  readonly ids: Set<string>;
  readonly issues: KpSchemeSourceIssue[];
}): void {
  const { delimiter, side, occurrenceId, parent, path, sourceText, ids, issues } =
    input;
  requireUniqueId(delimiter.id, `${path}.id`, ids, issues);
  const expectedId = kpSchemeSourceDelimiterId(occurrenceId, side);
  if (delimiter.id !== expectedId) {
    issues.push(issue(`${path}.id`, `expected delimiter ID ${expectedId}`));
  }
  const lexeme = side === "open" ? "(" : ")";
  const expectedKind = side === "open" ? "open-paren" : "close-paren";
  if (delimiter.kind !== expectedKind) {
    issues.push(issue(`${path}.kind`, `expected ${expectedKind}`));
  }
  validateSpan(delimiter.source, `${path}.source`, sourceText, issues);
  if (delimiter.source.start < parent.start || delimiter.source.end > parent.end ||
      delimiter.source.end - delimiter.source.start !== 1 ||
      sourceText.slice(delimiter.source.start, delimiter.source.end) !== lexeme) {
    issues.push(issue(`${path}.source`, `delimiter span must select ${lexeme}`));
  }
}

function validateSpan(
  span: KpSchemeSourceSpan,
  path: string,
  sourceText: string,
  issues: KpSchemeSourceIssue[]
): void {
  if (!Number.isSafeInteger(span.start) || !Number.isSafeInteger(span.end) ||
      span.start < 0 || span.end <= span.start || span.end > sourceText.length) {
    issues.push(issue(path, "source span must be a non-empty in-bounds range"));
  }
}

function requireUniqueId(
  id: string,
  path: string,
  ids: Set<string>,
  issues: KpSchemeSourceIssue[]
): void {
  if (id.trim().length === 0) {
    issues.push(issue(path, "ID must not be empty"));
  } else if (ids.has(id)) {
    issues.push(issue(path, `duplicate ID ${id}`));
  }
  ids.add(id);
}

function sameAddress(
  left: readonly number[],
  right: readonly number[]
): boolean {
  return left.length === right.length &&
    left.every((part, index) => part === right[index]);
}

function freezeDocument(input: KpSchemeSourceDocument): KpSchemeSourceDocument {
  return Object.freeze({
    ...input,
    forms: Object.freeze(input.forms.map(freezeExpression))
  });
}

function freezeExpression(
  expression: KpSchemeSourceExpression
): KpSchemeSourceExpression {
  const base = {
    ...expression,
    address: Object.freeze([...expression.address]),
    source: Object.freeze({ ...expression.source })
  };
  if (expression.kind === "atom") return Object.freeze(base);
  return Object.freeze({
    ...base,
    delimiters: Object.freeze({
      open: Object.freeze({
        ...expression.delimiters.open,
        source: Object.freeze({ ...expression.delimiters.open.source })
      }),
      close: Object.freeze({
        ...expression.delimiters.close,
        source: Object.freeze({ ...expression.delimiters.close.source })
      })
    }),
    children: Object.freeze(expression.children.map(freezeExpression))
  });
}

function issue(path: string, message: string): KpSchemeSourceIssue {
  return Object.freeze({ path, message });
}
