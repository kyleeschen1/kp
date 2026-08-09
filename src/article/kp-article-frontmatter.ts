import {
  createKpArticleSourceSpan,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";

export const kpArticleSchema = "kp.article.v1" as const;

export interface KpArticleFrontmatter {
  readonly kind: "kp-article-frontmatter";
  readonly schema: string;
  readonly id: string;
  readonly imports: Readonly<Record<string, string>>;
  readonly span: KpArticleSourceSpan;
  readonly bodySpan: KpArticleSourceSpan;
}

export class KpArticleFrontmatterSyntaxError extends Error {
  readonly code: string;
  readonly span: KpArticleSourceSpan;

  constructor(code: string, message: string, span: KpArticleSourceSpan) {
    super(message);
    this.name = "KpArticleFrontmatterSyntaxError";
    this.code = code;
    this.span = span;
  }
}

export function parseKpArticleFrontmatter(
  source: KpArticleSource
): KpArticleFrontmatter {
  const lines = source.lineStarts.map((start, index) => lineRecord(source, start, index));
  if (lines[0]?.text !== "---") {
    throw syntaxError(source, lines[0], "frontmatter-opening", "KP article frontmatter must begin with ---. ");
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.text === "---");
  if (closingIndex < 0) {
    throw syntaxError(
      source,
      lines[lines.length - 1],
      "frontmatter-closing",
      "KP article frontmatter needs a closing --- delimiter."
    );
  }

  const bodyStart = lines[closingIndex + 1]?.start ?? source.text.length;
  const values = new Map<string, string>();
  const imports: Record<string, string> = {};
  let sawKpRoot = false;
  let inImports = false;

  for (const line of lines.slice(1, closingIndex)) {
    if (line.text.trim().length === 0 || line.text.trimStart().startsWith("#")) continue;

    if (line.text === "kp:") {
      if (sawKpRoot) {
        throw syntaxError(source, line, "frontmatter-duplicate-kp", "KP frontmatter can contain only one kp mapping.");
      }
      sawKpRoot = true;
      inImports = false;
      continue;
    }
    if (!sawKpRoot) {
      throw syntaxError(source, line, "frontmatter-root", "KP frontmatter may contain only the root kp mapping.");
    }

    const property = line.text.match(/^  ([a-z][a-zA-Z0-9-]*):(?: (.*))?$/u);
    if (property !== null) {
      const key = property[1]!;
      const rawValue = property[2];
      if (key === "imports") {
        if (rawValue !== undefined && rawValue.trim().length > 0) {
          throw syntaxError(source, line, "frontmatter-imports-shape", "kp.imports must be an indented mapping.");
        }
        if (values.has("imports")) {
          throw syntaxError(source, line, "frontmatter-duplicate-key", "KP frontmatter repeats imports.");
        }
        values.set("imports", "");
        inImports = true;
        continue;
      }
      if (key !== "schema" && key !== "id") {
        throw syntaxError(source, line, "frontmatter-unknown-key", `Unknown kp frontmatter key: ${key}.`);
      }
      if (values.has(key)) {
        throw syntaxError(source, line, "frontmatter-duplicate-key", `KP frontmatter repeats ${key}.`);
      }
      values.set(key, parseScalar(source, line, rawValue));
      inImports = false;
      continue;
    }

    const imported = line.text.match(/^    ([A-Za-z][A-Za-z0-9_-]*): (.+)$/u);
    if (imported !== null && inImports) {
      const alias = imported[1]!;
      if (Object.hasOwn(imports, alias)) {
        throw syntaxError(source, line, "frontmatter-duplicate-import", `KP frontmatter repeats import alias ${alias}.`);
      }
      imports[alias] = parseScalar(source, line, imported[2]);
      continue;
    }

    throw syntaxError(
      source,
      line,
      "frontmatter-indentation",
      "KP frontmatter accepts two-space properties and four-space import entries only."
    );
  }

  if (!sawKpRoot) {
    throw syntaxError(source, lines[0], "frontmatter-kp-required", "KP article frontmatter needs a kp mapping.");
  }
  const schema = requiredValue(source, lines, closingIndex, values, "schema");
  const id = requiredValue(source, lines, closingIndex, values, "id");
  if (!values.has("imports")) {
    throw syntaxError(source, lines[closingIndex], "frontmatter-imports-required", "KP article frontmatter needs an imports mapping.");
  }

  return Object.freeze({
    kind: "kp-article-frontmatter" as const,
    schema,
    id,
    imports: Object.freeze({ ...imports }),
    span: createKpArticleSourceSpan(source, 0, bodyStart),
    bodySpan: createKpArticleSourceSpan(source, bodyStart, source.text.length)
  });
}

interface SourceLine {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

function lineRecord(
  source: KpArticleSource,
  start: number,
  index: number
): SourceLine {
  const nextStart = source.lineStarts[index + 1] ?? source.text.length;
  let end = nextStart;
  if (end > start && source.text.charCodeAt(end - 1) === 10) end -= 1;
  if (end > start && source.text.charCodeAt(end - 1) === 13) end -= 1;
  return Object.freeze({ start, end, text: source.text.slice(start, end) });
}

function parseScalar(
  source: KpArticleSource,
  line: SourceLine,
  rawValue: string | undefined
): string {
  const value = rawValue?.trim() ?? "";
  if (value.length === 0) {
    throw syntaxError(source, line, "frontmatter-empty-value", "KP frontmatter scalar values cannot be empty.");
  }
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === "string") return parsed;
    } catch {
      // The source-located syntax error below is more useful than JSON details.
    }
    throw syntaxError(source, line, "frontmatter-invalid-string", "KP frontmatter contains an invalid quoted string.");
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) {
      throw syntaxError(source, line, "frontmatter-invalid-string", "KP frontmatter contains an invalid quoted string.");
    }
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if (/[#{}\[\]]/u.test(value)) {
    throw syntaxError(
      source,
      line,
      "frontmatter-complex-value",
      "KP frontmatter accepts plain or quoted scalar values only."
    );
  }
  return value;
}

function requiredValue(
  source: KpArticleSource,
  lines: readonly SourceLine[],
  closingIndex: number,
  values: ReadonlyMap<string, string>,
  key: "schema" | "id"
): string {
  const value = values.get(key);
  if (value !== undefined) return value;
  throw syntaxError(
    source,
    lines[closingIndex],
    `frontmatter-${key}-required`,
    `KP article frontmatter needs kp.${key}.`
  );
}

function syntaxError(
  source: KpArticleSource,
  line: SourceLine | undefined,
  code: string,
  message: string
): KpArticleFrontmatterSyntaxError {
  const start = line?.start ?? 0;
  const end = line?.end ?? Math.min(source.text.length, start + 1);
  return new KpArticleFrontmatterSyntaxError(
    code,
    message.trim(),
    createKpArticleSourceSpan(source, start, end)
  );
}

