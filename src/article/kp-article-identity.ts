import {
  createKpArticleSourceSpan,
  sliceKpArticleSource,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";
import type { KpArticleDirectiveAttribute } from "./kp-article-directives.ts";
import { scanKpArticleMarkdownLinks } from "./kp-article-markdown-links.ts";
import {
  validateKpArticle,
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
      if (
        attribute.kind === "property" &&
        ["target", "context", "run", "range"].includes(attribute.name ?? "")
      ) {
        edits.push(...semanticAttributeEdits(source, attribute, from, to));
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

function semanticAttributeEdits(
  source: KpArticleSource,
  attribute: KpArticleDirectiveAttribute,
  from: string,
  to: string
): KpArticleTextEdit[] {
  const span = attributeValueSpan(source, attribute.span, attribute.raw);
  const rawValue = sliceKpArticleSource(source, span);
  const matches = [...rawValue.matchAll(
    new RegExp(`(^|\\s|\\.\\.)${from}(?=/)`, "gu")
  )];
  return matches.map((match) => {
    const prefixLength = match[1]?.length ?? 0;
    const start = span.start.offset + match.index + prefixLength;
    return textEdit(
      createKpArticleSourceSpan(source, start, start + from.length),
      to
    );
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
  const validation = validateKpArticle(source);
  if (!validation.valid || validation.frontmatter === undefined) {
    throw new KpArticleIdentityError(
      "identity-source-invalid",
      "Identity operations require a valid kp.article.v1 source."
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
  for (const link of scanKpArticleMarkdownLinks(source)) {
      const isStageReference = link.url.startsWith("kp-ref:")
        && (link.url.slice("kp-ref:".length) === from || link.url.slice("kp-ref:".length).startsWith(`${from}/`));
      const isFragmentReference = link.url === `#${from}`;
      if (!isStageReference && !isFragmentReference) continue;
      const prefixLength = isStageReference ? "kp-ref:".length : 1;
      const destinationStart = link.destinationSpan.start.offset + prefixLength;
      edits.push(textEdit(
        createKpArticleSourceSpan(source, destinationStart, destinationStart + from.length),
        to
      ));
  }
  return edits;
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
