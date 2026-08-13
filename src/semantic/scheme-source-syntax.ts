import {
  assertKpCodeSourceTokenStream,
  type KpCodeSourceToken,
  type KpCodeSyntaxRole
} from "./code-source-token-protocol.ts";
import type {
  KpSchemeSourceDocument,
  KpSchemeSourceExpression
} from "./scheme-factorial-source-model.ts";

export interface KpSchemeSourceSyntaxToken extends KpCodeSourceToken {
  readonly id: string;
  readonly syntaxIdentityKind: "atom" | "delimiter";
}

/**
 * Scheme keeps occurrence and delimiter identity; the shared protocol only
 * validates the exact source ranges and optical role carried to paint.
 */
export function createKpSchemeSourceSyntaxTokens(
  document: KpSchemeSourceDocument
): readonly KpSchemeSourceSyntaxToken[] {
  const tokens = document.forms.flatMap(tokensForExpression)
    .sort((left, right) => left.startOffset - right.startOffset);
  assertKpCodeSourceTokenStream(document.sourceText, tokens);
  return Object.freeze(tokens.map((token) => Object.freeze(token)));
}

/** Lexeme classification never mints semantic or runtime identity. */
export function resolveKpSchemeMaterialSyntaxRole(input: {
  readonly lexeme: string;
  readonly provenance: { readonly sourceOccurrenceId: string };
}): KpCodeSyntaxRole {
  if (input.provenance.sourceOccurrenceId.trim() === "") {
    throw new Error("Scheme material syntax requires source-owned provenance.");
  }
  return roleForLexeme(input.lexeme);
}

function tokensForExpression(
  expression: KpSchemeSourceExpression
): KpSchemeSourceSyntaxToken[] {
  if (expression.kind === "atom") {
    return [{
      id: expression.id,
      syntaxIdentityKind: "atom",
      text: expression.lexeme,
      kind: expression.role === "keyword"
        ? "keyword"
        : expression.role === "integer"
          ? "number"
          : roleForLexeme(expression.lexeme),
      startOffset: expression.source.start,
      endOffset: expression.source.end
    }];
  }
  return [
    {
      id: expression.delimiters.open.id,
      syntaxIdentityKind: "delimiter",
      text: "(",
      kind: "punctuation",
      startOffset: expression.delimiters.open.source.start,
      endOffset: expression.delimiters.open.source.end
    },
    ...expression.children.flatMap(tokensForExpression),
    {
      id: expression.delimiters.close.id,
      syntaxIdentityKind: "delimiter",
      text: ")",
      kind: "punctuation",
      startOffset: expression.delimiters.close.source.start,
      endOffset: expression.delimiters.close.source.end
    }
  ];
}

function roleForLexeme(lexeme: string): KpCodeSyntaxRole {
  if (lexeme === "define" || lexeme === "if" || lexeme === "lambda") {
    return "keyword";
  }
  if (lexeme === "factorial") return "function";
  if (lexeme === "=" || lexeme === "*" || lexeme === "-") return "operator";
  if (lexeme === "(" || lexeme === ")") return "punctuation";
  if (/^-?\d+$/u.test(lexeme)) return "number";
  return "identifier";
}
