import {
  defineKpSchemeSourceDocument,
  kpSchemeSourceDelimiterId,
  kpSchemeSourceOccurrenceId,
  KP_SCHEME_FACTORIAL_SOURCE,
  type KpSchemeSourceAtom,
  type KpSchemeSourceDocument,
  type KpSchemeSourceExpression,
  type KpSchemeSourceList,
  type KpSchemeSourceListRole
} from "./scheme-factorial-source-model.ts";

export const KP_SCHEME_FACTORIAL_DOCUMENT_ID =
  "scheme-source.factorial-3" as const;

const supportedSymbols = new Set([
  "define",
  "factorial",
  "n",
  "if",
  "=",
  "*",
  "-"
]);

export function parseKpSchemeFactorialSource(
  sourceText: string = KP_SCHEME_FACTORIAL_SOURCE
): KpSchemeSourceDocument {
  const parser = new KpSchemeFactorialParser(sourceText);
  const document = defineKpSchemeSourceDocument({
    schemaVersion: "kp.scheme-source-document.v1",
    id: KP_SCHEME_FACTORIAL_DOCUMENT_ID,
    sourceText,
    forms: parser.parseForms()
  });
  assertFactorialProgramShape(document);
  return document;
}

class KpSchemeFactorialParser {
  private cursor = 0;
  private readonly sourceText: string;

  public constructor(sourceText: string) {
    this.sourceText = sourceText;
  }

  public parseForms(): readonly KpSchemeSourceExpression[] {
    const forms: KpSchemeSourceExpression[] = [];
    this.skipWhitespace();
    while (!this.atEnd()) {
      forms.push(this.parseExpression([forms.length]));
      this.skipWhitespace();
    }
    return forms;
  }

  private parseExpression(address: readonly number[]): KpSchemeSourceExpression {
    this.skipWhitespace();
    const character = this.sourceText[this.cursor];
    if (character === "(") return this.parseList(address);
    if (character === ")") this.fail("unexpected closing parenthesis");
    if (character === undefined) this.fail("expected an expression");
    return this.parseAtom(address);
  }

  private parseList(address: readonly number[]): KpSchemeSourceList {
    const start = this.cursor;
    const id = kpSchemeSourceOccurrenceId(
      KP_SCHEME_FACTORIAL_DOCUMENT_ID,
      address
    );
    this.cursor += 1;
    const children: KpSchemeSourceExpression[] = [];
    this.skipWhitespace();
    while (!this.atEnd() && this.sourceText[this.cursor] !== ")") {
      children.push(this.parseExpression([...address, children.length]));
      this.skipWhitespace();
    }
    if (this.atEnd()) this.fail("unterminated list", start);
    if (children.length === 0) this.fail("empty lists are outside the subset", start);
    const closeStart = this.cursor;
    this.cursor += 1;
    const role = classifyList(children);
    const classifiedChildren = role === "definition"
      ? classifyProcedureSignature(children)
      : children;
    return {
      kind: "list",
      id,
      address,
      role,
      source: { start, end: this.cursor },
      delimiters: {
        open: {
          id: kpSchemeSourceDelimiterId(id, "open"),
          kind: "open-paren",
          source: { start, end: start + 1 }
        },
        close: {
          id: kpSchemeSourceDelimiterId(id, "close"),
          kind: "close-paren",
          source: { start: closeStart, end: closeStart + 1 }
        }
      },
      children: classifiedChildren
    };
  }

  private parseAtom(address: readonly number[]): KpSchemeSourceAtom {
    const start = this.cursor;
    while (!this.atEnd() && !isTerminator(this.sourceText[this.cursor]!)) {
      this.cursor += 1;
    }
    const lexeme = this.sourceText.slice(start, this.cursor);
    if (/^-?\d+$/.test(lexeme)) {
      const value = Number(lexeme);
      if (!Number.isSafeInteger(value)) this.fail("integer is outside the safe range", start);
      return {
        kind: "atom",
        id: kpSchemeSourceOccurrenceId(KP_SCHEME_FACTORIAL_DOCUMENT_ID, address),
        address,
        atomKind: "integer",
        role: "integer",
        lexeme,
        source: { start, end: this.cursor }
      };
    }
    if (!supportedSymbols.has(lexeme)) {
      this.fail(`unsupported symbol ${JSON.stringify(lexeme)}`, start);
    }
    return {
      kind: "atom",
      id: kpSchemeSourceOccurrenceId(KP_SCHEME_FACTORIAL_DOCUMENT_ID, address),
      address,
      atomKind: "symbol",
      role: lexeme === "define" || lexeme === "if" ? "keyword" : "identifier",
      lexeme,
      source: { start, end: this.cursor }
    };
  }

  private skipWhitespace(): void {
    while (!this.atEnd() && /\s/.test(this.sourceText[this.cursor]!)) {
      this.cursor += 1;
    }
  }

  private atEnd(): boolean {
    return this.cursor >= this.sourceText.length;
  }

  private fail(message: string, at: number = this.cursor): never {
    throw new SyntaxError(`Scheme factorial source at ${at}: ${message}`);
  }
}

function classifyList(
  children: readonly KpSchemeSourceExpression[]
): KpSchemeSourceListRole {
  const head = atomLexeme(children[0]);
  if (head === "define") return "definition";
  if (head === "if") return "conditional";
  return "application";
}

function classifyProcedureSignature(
  children: readonly KpSchemeSourceExpression[]
): readonly KpSchemeSourceExpression[] {
  const signature = children[1];
  if (signature?.kind !== "list") {
    throw new SyntaxError("Scheme factorial definition requires a procedure signature.");
  }
  return children.map((child, index) => index === 1
    ? { ...signature, role: "procedure-signature" as const }
    : child);
}

function assertFactorialProgramShape(document: KpSchemeSourceDocument): void {
  if (document.forms.length !== 2) {
    throw new SyntaxError("Scheme factorial source requires one definition and one call.");
  }
  const [definition, call] = document.forms;
  requireListRole(definition, "definition", "first form");
  requireLexemes(definition, ["define", null, null], "factorial definition");
  const signature = definition.children[1];
  requireListRole(signature, "procedure-signature", "procedure signature");
  requireLexemes(signature, ["factorial", "n"], "procedure signature");
  const body = definition.children[2];
  requireListRole(body, "conditional", "factorial body");
  requireLexemes(body, ["if", null, "1", null], "factorial conditional");

  const predicate = body.children[1];
  requireListRole(predicate, "application", "base predicate");
  requireLexemes(predicate, ["=", "n", "0"], "base predicate");
  const product = body.children[3];
  requireListRole(product, "application", "recursive product");
  requireLexemes(product, ["*", "n", null], "recursive product");
  const recursion = product.children[2];
  requireListRole(recursion, "application", "recursive call");
  requireLexemes(recursion, ["factorial", null], "recursive call");
  const decrement = recursion.children[1];
  requireListRole(decrement, "application", "decrement");
  requireLexemes(decrement, ["-", "n", "1"], "decrement");

  requireListRole(call, "application", "second form");
  requireLexemes(call, ["factorial", "3"], "initial call");
}

function requireListRole(
  expression: KpSchemeSourceExpression | undefined,
  role: KpSchemeSourceListRole,
  label: string
): asserts expression is KpSchemeSourceList {
  if (expression?.kind !== "list" || expression.role !== role) {
    throw new SyntaxError(`Scheme factorial ${label} must be a ${role} list.`);
  }
}

function requireLexemes(
  expression: KpSchemeSourceList,
  expected: readonly (string | null)[],
  label: string
): void {
  if (expression.children.length !== expected.length ||
      expected.some((lexeme, index) => lexeme !== null &&
        atomLexeme(expression.children[index]) !== lexeme)) {
    throw new SyntaxError(`Scheme factorial ${label} has an unsupported shape.`);
  }
}

function atomLexeme(expression: KpSchemeSourceExpression | undefined): string | null {
  return expression?.kind === "atom" ? expression.lexeme : null;
}

function isTerminator(character: string): boolean {
  return /\s/.test(character) || character === "(" || character === ")";
}
