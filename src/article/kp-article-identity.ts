import {
  createKpArticleSourceSpan,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";
import {
  validateKpArticleRc1,
  type KpValidatedArticleDirective
} from "./kp-article-validation.ts";

export interface KpArticleIdentity {
  readonly documentId: string;
  readonly localId: string;
  readonly fullId: string;
  readonly directiveKind: KpValidatedArticleDirective["kind"];
  readonly span: KpArticleSourceSpan;
}

export interface KpArticleTextEdit {
  readonly span: KpArticleSourceSpan;
  readonly replacement: string;
}

export interface KpArticleRename {
  readonly documentId: string;
  readonly from: string;
  readonly to: string;
  readonly edits: readonly KpArticleTextEdit[];
}

export class KpArticleIdentityError extends Error {
  readonly code: "identity-source-invalid" | "identity-unknown" | "identity-invalid" | "identity-collision";

  constructor(code: KpArticleIdentityError["code"], message: string) {
    super(message);
    this.name = "KpArticleIdentityError";
    this.code = code;
  }
}

const localIdPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export function indexKpArticleIdentities(source: KpArticleSource): readonly KpArticleIdentity[] {
  const validation = requireValidArticle(source);
  const documentId = validation.frontmatter!.id;
  return Object.freeze(validation.directives.map((directive) => {
    const idAttribute = directive.source.attributes.find(({ kind }) => kind === "id")!;
    return Object.freeze({
      documentId,
      localId: directive.id,
      fullId: `${documentId}#${directive.id}`,
      directiveKind: directive.kind,
      span: idAttribute.span
    });
  }));
}

export function suggestKpArticleLocalId(
  phrase: string,
  existingIds: Iterable<string>
): string {
  const base = slugify(phrase);
  const occupied = new Set(existingIds);
  if (!occupied.has(base)) return base;
  let suffix = 2;
  while (occupied.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function renameKpArticleIdentity(
  source: KpArticleSource,
  from: string,
  to: string
): KpArticleRename {
  if (!localIdPattern.test(to)) {
    throw new KpArticleIdentityError(
      "identity-invalid",
      "Replacement IDs must be lowercase readable slugs separated by hyphens."
    );
  }

  const validation = requireValidArticle(source);
  const identities = new Map(validation.directives.map((directive) => [directive.id, directive]));
  if (!identities.has(from)) {
    throw new KpArticleIdentityError("identity-unknown", `Unknown article-local identity: ${from}.`);
  }
  if (from !== to && identities.has(to)) {
    throw new KpArticleIdentityError("identity-collision", `Article-local identity already exists: ${to}.`);
  }

  const edits: KpArticleTextEdit[] = [];
  for (const directive of validation.directives) {
    for (const attribute of directive.source.attributes) {
      if (attribute.kind === "id" && attribute.value === from) {
        edits.push(textEdit(attribute.span, `#${to}`));
      }
      if (attribute.kind === "property" && attribute.name === "stage" && attribute.value === from) {
        edits.push(textEdit(attributeValueSpan(source, attribute.span, attribute.raw), to));
      }
    }
  }
  edits.push(...markdownReferenceEdits(source, from, to));
  edits.sort((left, right) => left.span.start.offset - right.span.start.offset);
  assertNonOverlapping(edits);

  return Object.freeze({
    documentId: validation.frontmatter!.id,
    from,
    to,
    edits: Object.freeze(edits)
  });
}

export function applyKpArticleTextEdits(
  source: KpArticleSource,
  edits: readonly KpArticleTextEdit[]
): string {
  const ordered = [...edits].sort((left, right) => left.span.start.offset - right.span.start.offset);
  assertNonOverlapping(ordered);
  let text = source.text;
  for (const edit of ordered.reverse()) {
    if (edit.span.sourceId !== source.sourceId) {
      throw new Error(`Edit span ${edit.span.sourceId} does not belong to ${source.sourceId}.`);
    }
    text = `${text.slice(0, edit.span.start.offset)}${edit.replacement}${text.slice(edit.span.end.offset)}`;
  }
  return text;
}

function requireValidArticle(source: KpArticleSource) {
  const validation = validateKpArticleRc1(source);
  if (!validation.valid || validation.frontmatter === undefined) {
    throw new KpArticleIdentityError(
      "identity-source-invalid",
      "Identity operations require a valid kp.article.v1-rc1 source."
    );
  }
  return validation;
}

function slugify(phrase: string): string {
  const slug = phrase
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[’']/gu, "")
    .replace(/&/gu, " and ")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return /^[a-z]/u.test(slug) ? slug : `section${slug.length === 0 ? "" : `-${slug}`}`;
}

function attributeValueSpan(
  source: KpArticleSource,
  span: KpArticleSourceSpan,
  raw: string
): KpArticleSourceSpan {
  const equals = raw.indexOf("=");
  const quoted = raw[equals + 1] === '"' || raw[equals + 1] === "'";
  const start = span.start.offset + equals + 1 + (quoted ? 1 : 0);
  const end = span.end.offset - (quoted ? 1 : 0);
  return createKpArticleSourceSpan(source, start, end);
}

function markdownReferenceEdits(
  source: KpArticleSource,
  from: string,
  to: string
): KpArticleTextEdit[] {
  const edits: KpArticleTextEdit[] = [];
  let fence: { marker: string; length: number } | undefined;

  for (let index = 0; index < source.lineStarts.length; index += 1) {
    const lineStart = source.lineStarts[index]!;
    const next = source.lineStarts[index + 1] ?? source.text.length;
    const line = source.text.slice(lineStart, next).replace(/\r?\n$/u, "");
    const fenceRun = line.match(/^ {0,3}(`{3,}|~{3,})/u)?.[1];
    if (fence !== undefined) {
      if (fenceRun?.[0] === fence.marker && fenceRun.length >= fence.length) fence = undefined;
      continue;
    }
    if (fenceRun !== undefined) {
      fence = { marker: fenceRun[0]!, length: fenceRun.length };
      continue;
    }

    const protectedRanges = inlineCodeRanges(line);
    const links = line.matchAll(/\]\((kp-ref:|#)([^)\s]+)\)/gu);
    for (const link of links) {
      if (link.index === undefined || isProtected(link.index, protectedRanges)) continue;
      const prefix = link[1]!;
      const destination = link[2]!;
      const isStageReference = prefix === "kp-ref:" && (destination === from || destination.startsWith(`${from}/`));
      const isFragmentReference = prefix === "#" && destination === from;
      if (!isStageReference && !isFragmentReference) continue;
      const destinationStart = lineStart + link.index + link[0].indexOf(destination);
      edits.push(textEdit(
        createKpArticleSourceSpan(source, destinationStart, destinationStart + from.length),
        to
      ));
    }
  }
  return edits;
}

function inlineCodeRanges(line: string): readonly Readonly<{ start: number; end: number }>[] {
  const ranges: Array<Readonly<{ start: number; end: number }>> = [];
  let opening: { start: number; length: number } | undefined;
  for (let index = 0; index < line.length;) {
    if (line[index] !== "`") {
      index += 1;
      continue;
    }
    let end = index + 1;
    while (line[end] === "`") end += 1;
    const length = end - index;
    if (opening === undefined) {
      opening = { start: index, length };
    } else if (opening.length === length) {
      ranges.push(Object.freeze({ start: opening.start, end }));
      opening = undefined;
    }
    index = end;
  }
  if (opening !== undefined) ranges.push(Object.freeze({ start: opening.start, end: line.length }));
  return Object.freeze(ranges);
}

function isProtected(offset: number, ranges: readonly Readonly<{ start: number; end: number }>[]): boolean {
  return ranges.some(({ start, end }) => offset >= start && offset < end);
}

function textEdit(span: KpArticleSourceSpan, replacement: string): KpArticleTextEdit {
  return Object.freeze({ span, replacement });
}

function assertNonOverlapping(edits: readonly KpArticleTextEdit[]): void {
  for (let index = 1; index < edits.length; index += 1) {
    const previous = edits[index - 1]!;
    const current = edits[index]!;
    if (previous.span.end.offset > current.span.start.offset) {
      throw new Error("KP article text edits must not overlap.");
    }
  }
}
