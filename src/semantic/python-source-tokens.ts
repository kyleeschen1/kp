export type KpPythonTokenKind =
  | "keyword"
  | "identifier"
  | "function"
  | "type"
  | "boolean"
  | "number"
  | "string"
  | "comment"
  | "operator"
  | "punctuation";

export interface KpPythonSourceToken {
  readonly id: string;
  readonly text: string;
  readonly kind: KpPythonTokenKind;
  readonly startOffset: number;
  readonly endOffset: number;
}

export interface KpPythonLexicalEvidence {
  readonly id: string;
  readonly kindName: string;
  readonly text: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

const keywords = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await",
  "break", "class", "continue", "def", "del", "elif", "else", "except",
  "finally", "for", "from", "global", "if", "import", "in", "is",
  "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
  "while", "with", "yield"
]);

const constants = new Set(["False", "None", "True"]);
const types = new Set([
  "bool", "bytes", "dict", "float", "frozenset", "int", "list", "object",
  "set", "str", "tuple"
]);
const operatorPattern = /^(?:\+|-|\*|\/|\/\/|%|\*\*|@|<<|>>|&|\||\^|~|:=|<|>|<=|>=|==|!=|=|\+=|-=|\*=|\/=|\/=|%=|@=|&=|\|=|\^=|>>=|<<=|\*\*=|\/\/=|->)$/;

/**
 * Python's stdlib tokenize output is build-time evidence. This classifier
 * adds paint roles only; AST entities remain the sole semantic authority.
 */
export function createKpPythonSourceTokens(
  evidence: readonly KpPythonLexicalEvidence[]
): readonly KpPythonSourceToken[] {
  const paintable = evidence.filter(({ kindName, text }) =>
    text.length > 0 && !["INDENT", "DEDENT", "NEWLINE", "NL", "ENDMARKER"]
      .includes(kindName)
  );
  return Object.freeze(paintable.map((record, index) => Object.freeze({
    id: record.id,
    text: record.text,
    kind: classify(record, paintable[index - 1], paintable[index + 1]),
    startOffset: record.startOffset,
    endOffset: record.endOffset
  })));
}

function classify(
  record: KpPythonLexicalEvidence,
  prior: KpPythonLexicalEvidence | undefined,
  next: KpPythonLexicalEvidence | undefined
): KpPythonTokenKind {
  if (record.kindName === "COMMENT") return "comment";
  if (record.kindName === "STRING") return "string";
  if (record.kindName === "NUMBER") return "number";
  if (constants.has(record.text)) return "boolean";
  if (types.has(record.text)) return "type";
  if (keywords.has(record.text)) return "keyword";
  if (record.kindName === "NAME") {
    if (prior?.text === "def" || next?.text === "(") return "function";
    return "identifier";
  }
  if (operatorPattern.test(record.text)) return "operator";
  return "punctuation";
}
