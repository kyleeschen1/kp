import {
  resolveKpArticleImports,
  type KpArticleImportLock,
  type KpVignetteRelease
} from "./kp-article-import-lock.ts";
import {
  resolveKpArticleSemanticReferences,
  type KpArticleSemanticReference
} from "./kp-article-semantic-references.ts";
import {
  createKpArticleSourceSpan,
  sliceKpArticleSource,
  type KpArticleSource,
  type KpArticleSourceSpan
} from "./kp-article-source.ts";
import {
  validateKpArticle,
  type KpValidatedArticleDirective
} from "./kp-article-validation.ts";

export const kpArticleDocumentSchema = "kp.article-document.v1" as const;

export type KpArticleBlock =
  | KpArticleMarkdownBlock
  | KpArticleStageBlock
  | KpArticlePassageBlock
  | KpArticleFocusBlock
  | KpArticleMotionBlock;

export interface KpArticleMarkdownBlock {
  readonly kind: "markdown";
  readonly key: string;
  readonly markdown: string;
  readonly referenceIds: readonly string[];
}

interface KpArticleIdentifiedBlock {
  readonly id: string;
  readonly fullId: string;
}

export interface KpArticleStageBlock extends KpArticleIdentifiedBlock {
  readonly kind: "stage";
  readonly importAlias: string;
  readonly vignette: KpVignetteRelease;
  readonly preset?: string;
  readonly params?: string;
  readonly label?: string;
}

export interface KpArticlePassageBlock extends KpArticleIdentifiedBlock {
  readonly kind: "passage";
  readonly markdown: string;
  readonly intent?: string;
  readonly claims: readonly string[];
  readonly referenceIds: readonly string[];
}

export interface KpArticleFocusBlock extends KpArticleIdentifiedBlock {
  readonly kind: "focus";
  readonly stageId: string;
  readonly targets: readonly string[];
  readonly context: readonly string[];
  readonly intent?: string;
  readonly markdown: string;
  readonly referenceIds: readonly string[];
}

export interface KpArticleMotionBlock extends KpArticleIdentifiedBlock {
  readonly kind: "motion";
  readonly stageId: string;
  readonly transition:
    | Readonly<{ kind: "run"; path: string }>
    | Readonly<{ kind: "range"; from: string; to: string }>;
  readonly intent?: string;
  readonly beforeMarkdown: string;
  readonly afterMarkdown?: string;
  readonly referenceIds: readonly string[];
}

export interface KpArticleDocumentReference {
  readonly id: string;
  readonly origin: KpArticleSemanticReference["origin"];
  readonly ownerId?: string;
  readonly label?: string;
  readonly stageId: string;
  readonly objectPath: string;
  readonly address: string;
  readonly fullId: string;
  readonly staticFragment: string;
  readonly timelineAuthority: "none";
}

export interface KpArticleDocument {
  /** Authoring/compiler IR; reader publication still adapts through KpLessonDocument. */
  readonly kind: "kp-article-document";
  readonly schemaVersion: typeof kpArticleDocumentSchema;
  readonly articleSchema: "kp.article.v1";
  readonly id: string;
  readonly sourceId: string;
  readonly importLock: KpArticleImportLock;
  readonly blocks: readonly KpArticleBlock[];
  readonly references: readonly KpArticleDocumentReference[];
}

export interface KpArticleSourceMapEntry {
  readonly key: string;
  readonly role:
    | "document"
    | "frontmatter"
    | "block"
    | "body"
    | "after"
    | "reference";
  readonly span: KpArticleSourceSpan;
}

export interface KpArticleSourceMap {
  readonly kind: "kp-article-source-map";
  readonly documentId: string;
  readonly sourceId: string;
  readonly entries: readonly KpArticleSourceMapEntry[];
}

export interface KpCompiledArticleDocument {
  readonly document: KpArticleDocument;
  readonly sourceMap: KpArticleSourceMap;
}

export function compileKpArticleDocument(input: {
  readonly source: KpArticleSource;
  readonly registry: readonly KpVignetteRelease[];
  readonly lock: KpArticleImportLock;
}): KpCompiledArticleDocument {
  const validation = validateKpArticle(input.source);
  if (!validation.valid || validation.frontmatter === undefined) {
    throw new Error("KpArticleDocument compilation requires a valid v1 source.");
  }
  const semantic = resolveKpArticleSemanticReferences(input.source);
  if (!semantic.valid) {
    throw new Error("KpArticleDocument compilation requires valid semantic references.");
  }
  const imports = resolveKpArticleImports(input.source, input.registry, input.lock);
  const releaseByStage = new Map(imports.stages.map(({ stageId, release }) => [stageId, release]));
  const references = semantic.references.map((reference) => freezeReference(reference));
  const referenceBySourceOffset = new Map(semantic.references.map((reference, index) => [
    reference.span.start.offset,
    references[index]!
  ]));
  const sourceMapEntries: KpArticleSourceMapEntry[] = [
    mapEntry("document", "document", createKpArticleSourceSpan(input.source, 0, input.source.text.length)),
    mapEntry("frontmatter", "frontmatter", validation.frontmatter.span)
  ];
  for (const reference of semantic.references) {
    const compiled = referenceBySourceOffset.get(reference.span.start.offset)!;
    sourceMapEntries.push(mapEntry(`reference:${compiled.id}`, "reference", reference.span));
  }

  const blocks: KpArticleBlock[] = [];
  let cursor = validation.frontmatter.bodySpan.start.offset;
  for (const directive of validation.directives) {
    addMarkdownBlock(
      input.source,
      cursor,
      directive.source.span.start.offset,
      blocks,
      sourceMapEntries,
      references,
      semantic.references
    );
    const block = compileDirectiveBlock(
      input.source,
      validation.frontmatter.id,
      directive,
      releaseByStage,
      references,
      semantic.references
    );
    blocks.push(block);
    sourceMapEntries.push(mapEntry(`block:${directive.id}`, "block", directive.source.span));
    sourceMapEntries.push(mapEntry(`block:${directive.id}:body`, "body", directive.source.bodySpan));
    if (directive.source.afterSpan !== undefined) {
      sourceMapEntries.push(mapEntry(`block:${directive.id}:after`, "after", directive.source.afterSpan));
    }
    cursor = directive.source.span.end.offset;
  }
  addMarkdownBlock(
    input.source,
    cursor,
    validation.frontmatter.bodySpan.end.offset,
    blocks,
    sourceMapEntries,
    references,
    semantic.references
  );

  const document: KpArticleDocument = Object.freeze({
    kind: "kp-article-document" as const,
    schemaVersion: kpArticleDocumentSchema,
    articleSchema: "kp.article.v1" as const,
    id: validation.frontmatter.id,
    sourceId: input.source.sourceId,
    importLock: imports.lock,
    blocks: Object.freeze(blocks),
    references: Object.freeze(references)
  });
  const sourceMap: KpArticleSourceMap = Object.freeze({
    kind: "kp-article-source-map" as const,
    documentId: document.id,
    sourceId: input.source.sourceId,
    entries: Object.freeze(sourceMapEntries.sort(compareMapEntries))
  });
  return Object.freeze({ document, sourceMap });
}

function compileDirectiveBlock(
  source: KpArticleSource,
  documentId: string,
  directive: KpValidatedArticleDirective,
  releaseByStage: ReadonlyMap<string, KpVignetteRelease>,
  references: readonly KpArticleDocumentReference[],
  semanticReferences: readonly KpArticleSemanticReference[]
): Exclude<KpArticleBlock, KpArticleMarkdownBlock> {
  const base = { id: directive.id, fullId: `${documentId}#${directive.id}` };
  switch (directive.kind) {
    case "stage": {
      const vignette = releaseByStage.get(directive.id)!;
      return Object.freeze({
        kind: "stage" as const,
        ...base,
        importAlias: directive.use,
        vignette,
        ...(directive.preset === undefined ? {} : { preset: directive.preset }),
        ...(directive.params === undefined ? {} : { params: directive.params }),
        ...(directive.label === undefined ? {} : { label: directive.label })
      });
    }
    case "passage":
      return Object.freeze({
        kind: "passage" as const,
        ...base,
        markdown: sliceKpArticleSource(source, directive.source.bodySpan),
        ...(directive.intent === undefined ? {} : { intent: directive.intent }),
        claims: directive.claims,
        referenceIds: referenceIdsWithin(directive.source.bodySpan, references, semanticReferences)
      });
    case "focus":
      return Object.freeze({
        kind: "focus" as const,
        ...base,
        stageId: directive.stage,
        targets: Object.freeze(ownedAddresses(semanticReferences, directive.id, "focus-target")),
        context: Object.freeze(ownedAddresses(semanticReferences, directive.id, "focus-context")),
        ...(directive.intent === undefined ? {} : { intent: directive.intent }),
        markdown: sliceKpArticleSource(source, directive.source.bodySpan),
        referenceIds: referenceIdsWithin(directive.source.bodySpan, references, semanticReferences)
      });
    case "motion": {
      const run = ownedAddresses(semanticReferences, directive.id, "motion-run")[0];
      const from = ownedAddresses(semanticReferences, directive.id, "motion-range-from")[0];
      const to = ownedAddresses(semanticReferences, directive.id, "motion-range-to")[0];
      const transition = run === undefined
        ? Object.freeze({ kind: "range" as const, from: from!, to: to! })
        : Object.freeze({ kind: "run" as const, path: run });
      return Object.freeze({
        kind: "motion" as const,
        ...base,
        stageId: directive.stage,
        transition,
        ...(directive.intent === undefined ? {} : { intent: directive.intent }),
        beforeMarkdown: sliceKpArticleSource(source, directive.source.bodySpan),
        ...(directive.source.afterSpan === undefined
          ? {}
          : { afterMarkdown: sliceKpArticleSource(source, directive.source.afterSpan) }),
        referenceIds: Object.freeze([
          ...referenceIdsWithin(directive.source.bodySpan, references, semanticReferences),
          ...(directive.source.afterSpan === undefined
            ? []
            : referenceIdsWithin(directive.source.afterSpan, references, semanticReferences))
        ])
      });
    }
  }
}

function addMarkdownBlock(
  source: KpArticleSource,
  start: number,
  end: number,
  blocks: KpArticleBlock[],
  sourceMapEntries: KpArticleSourceMapEntry[],
  references: readonly KpArticleDocumentReference[],
  semanticReferences: readonly KpArticleSemanticReference[]
): void {
  if (start >= end) return;
  const span = createKpArticleSourceSpan(source, start, end);
  const markdown = sliceKpArticleSource(source, span);
  if (markdown.trim().length === 0) return;
  const key = `markdown:${start}`;
  blocks.push(Object.freeze({
    kind: "markdown" as const,
    key,
    markdown,
    referenceIds: referenceIdsWithin(span, references, semanticReferences)
  }));
  sourceMapEntries.push(mapEntry(`block:${key}`, "block", span));
}

function freezeReference(reference: KpArticleSemanticReference): KpArticleDocumentReference {
  return Object.freeze({
    id: `${reference.origin}:${reference.span.start.offset}`,
    origin: reference.origin,
    ...(reference.ownerId === undefined ? {} : { ownerId: reference.ownerId }),
    ...(reference.label === undefined ? {} : { label: reference.label }),
    stageId: reference.stageId,
    objectPath: reference.objectPath,
    address: reference.address,
    fullId: reference.fullId,
    staticFragment: reference.staticFragment,
    timelineAuthority: reference.timelineAuthority
  });
}

function referenceIdsWithin(
  span: KpArticleSourceSpan,
  references: readonly KpArticleDocumentReference[],
  semanticReferences: readonly KpArticleSemanticReference[]
): readonly string[] {
  return Object.freeze(semanticReferences.flatMap((reference, index) => (
    reference.span.start.offset >= span.start.offset && reference.span.end.offset <= span.end.offset
      ? [references[index]!.id]
      : []
  )));
}

function ownedAddresses(
  references: readonly KpArticleSemanticReference[],
  ownerId: string,
  origin: KpArticleSemanticReference["origin"]
): string[] {
  return references.flatMap((reference) => (
    reference.ownerId === ownerId && reference.origin === origin ? [reference.fullId] : []
  ));
}

function mapEntry(
  key: string,
  role: KpArticleSourceMapEntry["role"],
  span: KpArticleSourceSpan
): KpArticleSourceMapEntry {
  return Object.freeze({ key, role, span });
}

function compareMapEntries(left: KpArticleSourceMapEntry, right: KpArticleSourceMapEntry): number {
  return left.span.start.offset - right.span.start.offset
    || right.span.end.offset - left.span.end.offset
    || left.key.localeCompare(right.key);
}
