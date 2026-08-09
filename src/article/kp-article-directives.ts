import {
  createKpArticleSourceSpan,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";

export const kpArticleDirectiveKinds = Object.freeze([
  "kp-stage",
  "kp-passage",
  "kp-focus",
  "kp-motion"
] as const);

export type KpArticleDirectiveKind = (typeof kpArticleDirectiveKinds)[number];

export interface KpArticleDirectiveAttribute {
  readonly kind: "id" | "property";
  readonly name?: string;
  readonly value: string;
  readonly raw: string;
  readonly span: KpArticleSourceSpan;
}

export interface KpArticleDirective {
  readonly kind: "kp-article-directive";
  readonly name: string;
  readonly recognizedKind?: KpArticleDirectiveKind;
  readonly attributes: readonly KpArticleDirectiveAttribute[];
  readonly headerSpan: KpArticleSourceSpan;
  readonly bodySpan: KpArticleSourceSpan;
  readonly afterSpan?: KpArticleSourceSpan;
  readonly span: KpArticleSourceSpan;
}

export class KpArticleDirectiveSyntaxError extends Error {
  readonly code: string;
  readonly span: KpArticleSourceSpan;

  constructor(code: string, message: string, span: KpArticleSourceSpan) {
    super(message);
    this.name = "KpArticleDirectiveSyntaxError";
    this.code = code;
    this.span = span;
  }
}

export function scanKpArticleDirectives(
  source: KpArticleSource,
  bodySpan: KpArticleSourceSpan = createKpArticleSourceSpan(source, 0, source.text.length)
): readonly KpArticleDirective[] {
  if (bodySpan.sourceId !== source.sourceId) {
    throw new Error(`Directive body span ${bodySpan.sourceId} does not belong to ${source.sourceId}.`);
  }

  const lines = source.lineStarts.map((start, index) => lineRecord(source, start, index));
  const directives: KpArticleDirective[] = [];
  let fence: Fence | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.start < bodySpan.start.offset || line.start >= bodySpan.end.offset) continue;

    if (fence !== undefined) {
      if (closesFence(line.text, fence)) fence = undefined;
      continue;
    }
    const openedFence = opensFence(line.text);
    if (openedFence !== undefined) {
      fence = openedFence;
      continue;
    }

    if (line.text === ":::" || line.text === "::after") {
      throw directiveError(
        source,
        line,
        "directive-orphan-marker",
        `Unexpected ${line.text} outside a KP directive.`
      );
    }

    if (!line.text.startsWith(":::kp-")) continue;
    const scanned = scanDirective(source, lines, index, bodySpan.end.offset);
    directives.push(scanned.directive);
    index = scanned.closingIndex;
  }

  return Object.freeze(directives);
}

function scanDirective(
  source: KpArticleSource,
  lines: readonly SourceLine[],
  openingIndex: number,
  bodyEnd: number
): { readonly directive: KpArticleDirective; readonly closingIndex: number } {
  const opening = lines[openingIndex]!;
  const header = opening.text.match(/^:::(kp-[a-z]+)(.*)$/u);
  if (header === null) {
    throw directiveError(source, opening, "directive-header", "Malformed KP directive header.");
  }

  const name = header[1]!;
  const remainder = header[2] ?? "";
  let attributeSource = "";
  let attributeOffset = opening.end;
  if (remainder.length > 0) {
    if (!remainder.startsWith("{") || !remainder.endsWith("}")) {
      throw directiveError(
        source,
        opening,
        "directive-attributes",
        "KP directive attributes must be enclosed in one pair of braces."
      );
    }
    attributeSource = remainder.slice(1, -1);
    attributeOffset = opening.start + opening.text.indexOf("{") + 1;
  }
  const attributes = scanAttributes(source, opening, attributeSource, attributeOffset);
  const contentStart = lines[openingIndex + 1]?.start ?? opening.end;
  let afterLine: SourceLine | undefined;
  let fence: Fence | undefined;

  for (let index = openingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.start >= bodyEnd) break;

    if (fence !== undefined) {
      if (closesFence(line.text, fence)) fence = undefined;
      continue;
    }
    const openedFence = opensFence(line.text);
    if (openedFence !== undefined) {
      fence = openedFence;
      continue;
    }

    if (line.text.startsWith(":::kp-")) {
      throw directiveError(
        source,
        line,
        "directive-nesting",
        "RC1 KP directives cannot be nested."
      );
    }
    if (line.text === "::after") {
      if (name !== "kp-motion") {
        throw directiveError(
          source,
          line,
          "directive-after-owner",
          "Only kp-motion may contain an ::after slot."
        );
      }
      if (afterLine !== undefined) {
        throw directiveError(
          source,
          line,
          "directive-after-duplicate",
          "A kp-motion directive may contain only one ::after slot."
        );
      }
      afterLine = line;
      continue;
    }
    if (line.text !== ":::") continue;

    const directiveEnd = lines[index + 1]?.start ?? line.end;
    const bodyEndOffset = afterLine?.start ?? line.start;
    const afterStart = afterLine === undefined
      ? undefined
      : lines[lines.indexOf(afterLine) + 1]?.start ?? afterLine.end;
    const recognizedKind = isKpArticleDirectiveKind(name) ? name : undefined;
    const directive: KpArticleDirective = Object.freeze({
      kind: "kp-article-directive" as const,
      name,
      ...(recognizedKind === undefined ? {} : { recognizedKind }),
      attributes,
      headerSpan: createKpArticleSourceSpan(source, opening.start, opening.end),
      bodySpan: createKpArticleSourceSpan(source, contentStart, bodyEndOffset),
      ...(afterStart === undefined
        ? {}
        : { afterSpan: createKpArticleSourceSpan(source, afterStart, line.start) }),
      span: createKpArticleSourceSpan(source, opening.start, directiveEnd)
    });
    return Object.freeze({ directive, closingIndex: index });
  }

  throw directiveError(
    source,
    opening,
    "directive-closing",
    `KP directive ${name} needs a closing ::: marker.`
  );
}

function scanAttributes(
  source: KpArticleSource,
  line: SourceLine,
  text: string,
  absoluteStart: number
): readonly KpArticleDirectiveAttribute[] {
  const attributes: KpArticleDirectiveAttribute[] = [];
  let index = 0;

  while (index < text.length) {
    while (text[index] === " ") index += 1;
    if (index >= text.length) break;
    const tokenStart = index;

    if (text[index] === "#") {
      index += 1;
      const valueStart = index;
      while (index < text.length && text[index] !== " ") index += 1;
      if (index === valueStart) {
        throw attributeError(source, line, absoluteStart + tokenStart, absoluteStart + index, "Directive IDs cannot be empty.");
      }
      const raw = text.slice(tokenStart, index);
      attributes.push(Object.freeze({
        kind: "id" as const,
        value: raw.slice(1),
        raw,
        span: createKpArticleSourceSpan(source, absoluteStart + tokenStart, absoluteStart + index)
      }));
      continue;
    }

    const name = text.slice(index).match(/^[A-Za-z][A-Za-z0-9-]*/u)?.[0];
    if (name === undefined) {
      throw attributeError(source, line, absoluteStart + index, absoluteStart + index + 1, "Malformed directive attribute name.");
    }
    index += name.length;
    if (text[index] !== "=") {
      throw attributeError(source, line, absoluteStart + tokenStart, absoluteStart + index, `Directive attribute ${name} needs =.`);
    }
    index += 1;
    const valueStart = index;
    const parsed = scanAttributeValue(source, line, text, index, absoluteStart);
    index = parsed.end;
    if (index === valueStart) {
      throw attributeError(source, line, absoluteStart + tokenStart, absoluteStart + index, `Directive attribute ${name} cannot be empty.`);
    }
    const raw = text.slice(tokenStart, index);
    attributes.push(Object.freeze({
      kind: "property" as const,
      name,
      value: parsed.value,
      raw,
      span: createKpArticleSourceSpan(source, absoluteStart + tokenStart, absoluteStart + index)
    }));
    if (index < text.length && text[index] !== " ") {
      throw attributeError(source, line, absoluteStart + index, absoluteStart + index + 1, "Directive attributes must be separated by spaces.");
    }
  }

  return Object.freeze(attributes);
}

function scanAttributeValue(
  source: KpArticleSource,
  line: SourceLine,
  text: string,
  start: number,
  absoluteStart: number
): { readonly value: string; readonly end: number } {
  const quote = text[start];
  if (quote !== '"' && quote !== "'") {
    let end = start;
    while (end < text.length && text[end] !== " ") end += 1;
    return { value: text.slice(start, end), end };
  }

  let end = start + 1;
  while (end < text.length) {
    if (quote === '"' && text[end] === "\\") {
      end += 2;
      continue;
    }
    if (text[end] === quote) break;
    end += 1;
  }
  if (end >= text.length) {
    throw attributeError(source, line, absoluteStart + start, absoluteStart + text.length, "Directive attribute string is not closed.");
  }
  const raw = text.slice(start, end + 1);
  if (quote === "'") {
    return { value: raw.slice(1, -1).replaceAll("''", "'"), end: end + 1 };
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === "string") return { value, end: end + 1 };
  } catch {
    // Emit the stable source-located scanner error below.
  }
  throw attributeError(source, line, absoluteStart + start, absoluteStart + end + 1, "Directive attribute string is invalid.");
}

function isKpArticleDirectiveKind(name: string): name is KpArticleDirectiveKind {
  return (kpArticleDirectiveKinds as readonly string[]).includes(name);
}

interface SourceLine {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

interface Fence {
  readonly marker: "`" | "~";
  readonly length: number;
}

function lineRecord(source: KpArticleSource, start: number, index: number): SourceLine {
  const nextStart = source.lineStarts[index + 1] ?? source.text.length;
  let end = nextStart;
  if (end > start && source.text.charCodeAt(end - 1) === 10) end -= 1;
  if (end > start && source.text.charCodeAt(end - 1) === 13) end -= 1;
  return Object.freeze({ start, end, text: source.text.slice(start, end) });
}

function opensFence(text: string): Fence | undefined {
  const match = text.match(/^ {0,3}(`{3,}|~{3,})/u);
  if (match === null) return undefined;
  const run = match[1]!;
  return Object.freeze({ marker: run[0] as Fence["marker"], length: run.length });
}

function closesFence(text: string, fence: Fence): boolean {
  const trimmed = text.startsWith("   ") ? text.slice(3) : text.trimStart();
  if (!trimmed.startsWith(fence.marker.repeat(fence.length))) return false;
  let markerLength = 0;
  while (trimmed[markerLength] === fence.marker) markerLength += 1;
  return markerLength >= fence.length && trimmed.slice(markerLength).trim().length === 0;
}

function directiveError(
  source: KpArticleSource,
  line: SourceLine,
  code: string,
  message: string
): KpArticleDirectiveSyntaxError {
  return new KpArticleDirectiveSyntaxError(
    code,
    message,
    createKpArticleSourceSpan(source, line.start, line.end)
  );
}

function attributeError(
  source: KpArticleSource,
  line: SourceLine,
  start: number,
  end: number,
  message: string
): KpArticleDirectiveSyntaxError {
  const boundedStart = Math.max(line.start, Math.min(start, line.end));
  const boundedEnd = Math.max(boundedStart, Math.min(end, line.end));
  return new KpArticleDirectiveSyntaxError(
    "directive-attribute-syntax",
    message,
    createKpArticleSourceSpan(source, boundedStart, boundedEnd)
  );
}
