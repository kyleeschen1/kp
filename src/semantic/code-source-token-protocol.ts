export const kpCodeSyntaxRoles = [
  "keyword",
  "identifier",
  "function",
  "property",
  "type",
  "boolean",
  "number",
  "string",
  "comment",
  "operator",
  "punctuation"
] as const;

export type KpCodeSyntaxRole = typeof kpCodeSyntaxRoles[number];

/**
 * Language frontends own tokenization and identity. This protocol only gives
 * renderers one exact, language-neutral stream for syntax paint.
 */
export interface KpCodeSourceToken {
  readonly text: string;
  readonly kind: KpCodeSyntaxRole;
  readonly startOffset: number;
  readonly endOffset: number;
}

const syntaxRoleSet = new Set<string>(kpCodeSyntaxRoles);

export function assertKpCodeSourceTokenStream(
  source: string,
  tokens: readonly KpCodeSourceToken[]
): void {
  let priorEnd = 0;
  for (const [index, token] of tokens.entries()) {
    if (!syntaxRoleSet.has(token.kind)) {
      throw new Error(`Code source token ${index} has unknown syntax role ${token.kind}.`);
    }
    if (
      token.startOffset < 0 ||
      token.endOffset <= token.startOffset ||
      token.endOffset > source.length
    ) {
      throw new Error(`Code source token ${index} has an invalid half-open range.`);
    }
    if (token.startOffset < priorEnd) {
      throw new Error(`Code source token ${index} overlaps the preceding token.`);
    }
    if (source.slice(token.startOffset, token.endOffset) !== token.text) {
      throw new Error(`Code source token ${index} does not match its source range.`);
    }
    priorEnd = token.endOffset;
  }
}
