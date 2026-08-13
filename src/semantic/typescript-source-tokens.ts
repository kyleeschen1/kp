import {
  assertKpCodeSourceTokenStream,
  type KpCodeSourceToken,
  type KpCodeSyntaxRole
} from "./code-source-token-protocol.ts";

export type KpTypeScriptTokenKind = KpCodeSyntaxRole;

export interface KpTypeScriptSourceToken extends KpCodeSourceToken {
  readonly kind: KpTypeScriptTokenKind;
}

const tokenPattern = /(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|===|!==|=>|>=|<=|==|!=|&&|\|\||\?\?|\+\+|--|\+=|-=|\*=|\/=|[{}()[\].,:;?+\-*/%=<>!&|])/g;

const keywords = new Set([
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "of",
  "return",
  "switch",
  "throw",
  "try",
  "typeof",
  "var",
  "while",
  "yield"
]);

const types = new Set([
  "any",
  "bigint",
  "boolean",
  "never",
  "number",
  "object",
  "string",
  "symbol",
  "unknown",
  "void"
]);

const booleans = new Set(["false", "true"]);

/**
 * Lightweight lexical highlighting for static and animated source projections.
 * Compiler-derived entities remain semantic authority; these roles only decide
 * paint and therefore stay cheap enough for the browser-side exemplar.
 */
export function tokenizeKpTypeScriptSource(
  source: string
): readonly KpTypeScriptSourceToken[] {
  const lexical = [...source.matchAll(tokenPattern)].map((match) => {
    const text = match[0];
    const startOffset = match.index;
    return { text, startOffset, endOffset: startOffset + text.length };
  });

  const tokens = Object.freeze(lexical.map((token, index) => Object.freeze({
    ...token,
    kind: classifyToken(
      token.text,
      lexical[index - 1]?.text,
      lexical[index + 1]?.text
    )
  })));
  assertKpCodeSourceTokenStream(source, tokens);
  return tokens;
}

function classifyToken(
  text: string,
  prior: string | undefined,
  next: string | undefined
): KpTypeScriptTokenKind {
  if (text.startsWith("//") || text.startsWith("/*")) return "comment";
  if (text.startsWith('"') || text.startsWith("'") || text.startsWith("`")) {
    return "string";
  }
  if (/^\d/.test(text)) return "number";
  if (booleans.has(text)) return "boolean";
  if (types.has(text)) return "type";
  if (keywords.has(text)) return "keyword";
  if (/^[A-Za-z_$]/.test(text)) {
    if (prior === ".") return "property";
    if (prior === "function" || next === "(") return "function";
    return "identifier";
  }
  if (/^(?:===|!==|=>|>=|<=|==|!=|&&|\|\||\?\?|\+\+|--|\+=|-=|\*=|\/=|[?+\-*/%=<>!&|])$/.test(text)) {
    return "operator";
  }
  return "punctuation";
}
