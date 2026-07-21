import type {
  KpLessonDocument,
  KpReaderArtifactRef,
  KpReaderSourceLocation
} from "../document/public-api.ts";

export interface KpReaderAssetCatalogEntry<
  TId extends string = string,
  TVersion extends string = string,
  TRendererId extends string = string,
  TObjectRefs extends readonly string[] = readonly string[]
> {
  readonly id: TId;
  readonly version: TVersion;
  readonly rendererId: TRendererId;
  readonly objectRefs: TObjectRefs;
}

export interface KpReaderAssetCatalog<
  TEntries extends readonly KpReaderAssetCatalogEntry[] = readonly KpReaderAssetCatalogEntry[]
> {
  readonly entries: TEntries;
}

export interface KpResolvedAssetReference {
  readonly blockId: string;
  readonly asset: KpReaderArtifactRef<"animation-asset">;
  readonly rendererId: string;
  readonly objectRefs: readonly string[];
}

export interface KpResolvedFocusReference {
  readonly ownerId: string;
  readonly objectRef: string;
  readonly assetBlockIds: readonly string[];
  readonly source?: KpReaderSourceLocation | undefined;
}

export interface KpResolvedLessonReferences {
  readonly document: KpLessonDocument;
  readonly assets: readonly KpResolvedAssetReference[];
  readonly focus: readonly KpResolvedFocusReference[];
}

export interface KpLessonReferenceIssue {
  readonly path: string;
  readonly message: string;
  readonly source?: KpReaderSourceLocation | undefined;
}

export class KpLessonReferenceError extends Error {
  readonly issues: readonly KpLessonReferenceIssue[];

  constructor(issues: readonly KpLessonReferenceIssue[]) {
    super(issues.map((issue) => {
      const prefix = issue.source === undefined
        ? issue.path
        : `${issue.source.sourceId}:${issue.source.start.line}:${issue.source.start.column}`;
      return `${prefix}: ${issue.message}`;
    }).join("\n"));
    this.name = "KpLessonReferenceError";
    this.issues = issues;
  }
}

export function defineKpReaderAssetCatalog<
  const TEntries extends readonly KpReaderAssetCatalogEntry[]
>(input: { readonly entries: TEntries }): KpReaderAssetCatalog<TEntries> {
  const keys = new Set<string>();
  for (const entry of input.entries) {
    const key = assetKey(entry.id, entry.version);
    if (keys.has(key)) throw new Error(`duplicate reader asset catalog entry ${key}`);
    keys.add(key);
    const refs = new Set<string>();
    for (const objectRef of entry.objectRefs) {
      if (objectRef.trim() === "") throw new Error(`${key} has an empty semantic object ref`);
      if (refs.has(objectRef)) throw new Error(`${key} repeats semantic object ref ${objectRef}`);
      refs.add(objectRef);
    }
  }
  return {
    entries: input.entries.map((entry) => ({
      ...entry,
      objectRefs: [...entry.objectRefs]
    })) as unknown as TEntries
  };
}

export function resolveKpLessonReferences(
  document: KpLessonDocument,
  catalog: KpReaderAssetCatalog
): KpResolvedLessonReferences {
  const issues: KpLessonReferenceIssue[] = [];
  const entries = new Map(catalog.entries.map((entry) => [
    assetKey(entry.id, entry.version),
    entry
  ]));
  const assets: KpResolvedAssetReference[] = [];
  const storyEntries = new Map<string, KpReaderAssetCatalogEntry>();

  document.blocks.forEach((block, blockIndex) => {
    if (block.kind !== "animation-story") return;
    const entry = entries.get(assetKey(block.asset.id, block.asset.version));
    if (entry === undefined) {
      issues.push({
        path: `blocks[${blockIndex}].asset`,
        message: `unknown animation asset ${block.asset.id}@${block.asset.version}`,
        source: block.source
      });
      return;
    }
    storyEntries.set(block.id, entry);
    assets.push({
      blockId: block.id,
      asset: { ...block.asset },
      rendererId: entry.rendererId,
      objectRefs: [...entry.objectRefs]
    });
  });

  const focus: KpResolvedFocusReference[] = [];
  const activeAssetsByObject = indexActiveObjects(assets);
  document.blocks.forEach((block, blockIndex) => {
    if (block.kind === "heading" || block.kind === "paragraph") {
      block.content.forEach((inline, inlineIndex) => {
        if (inline.kind !== "semantic-link") return;
        inline.objectRefs.forEach((objectRef, refIndex) => {
          resolveFocus({
            ownerId: block.id,
            objectRef,
            path: `blocks[${blockIndex}].content[${inlineIndex}].objectRefs[${refIndex}]`,
            source: inline.source ?? block.source,
            activeAssetsByObject,
            focus,
            issues
          });
        });
      });
      return;
    }
    const entry = storyEntries.get(block.id);
    block.beats.forEach((beat, beatIndex) => {
      beat.focusRefs.forEach((objectRef, refIndex) => {
        if (entry === undefined || !entry.objectRefs.includes(objectRef)) {
          issues.push({
            path: `blocks[${blockIndex}].beats[${beatIndex}].focusRefs[${refIndex}]`,
            message: `animation ${block.asset.id}@${block.asset.version} does not expose ${objectRef}`,
            source: beat.source ?? block.source
          });
          return;
        }
        focus.push({
          ownerId: beat.id,
          objectRef,
          assetBlockIds: [block.id],
          ...(beat.source === undefined ? {} : { source: beat.source })
        });
      });
    });
    block.attention?.phases.forEach((phase, phaseIndex) => {
      phase.focusRefs.forEach((objectRef, refIndex) => {
        if (entry === undefined || !entry.objectRefs.includes(objectRef)) {
          issues.push({
            path: `blocks[${blockIndex}].attention.phases[${phaseIndex}].focusRefs[${refIndex}]`,
            message: `animation ${block.asset.id}@${block.asset.version} does not expose ${objectRef}`,
            source: block.source
          });
          return;
        }
        focus.push({
          ownerId: phase.id,
          objectRef,
          assetBlockIds: [block.id],
          ...(block.source === undefined ? {} : { source: block.source })
        });
      });
    });
  });

  if (issues.length > 0) throw new KpLessonReferenceError(issues);
  return { document, assets, focus };
}

function indexActiveObjects(
  assets: readonly KpResolvedAssetReference[]
): ReadonlyMap<string, readonly string[]> {
  const result = new Map<string, string[]>();
  for (const asset of assets) {
    for (const objectRef of asset.objectRefs) {
      const blocks = result.get(objectRef) ?? [];
      blocks.push(asset.blockId);
      result.set(objectRef, blocks);
    }
  }
  return result;
}

function resolveFocus(input: {
  readonly ownerId: string;
  readonly objectRef: string;
  readonly path: string;
  readonly source?: KpReaderSourceLocation | undefined;
  readonly activeAssetsByObject: ReadonlyMap<string, readonly string[]>;
  readonly focus: KpResolvedFocusReference[];
  readonly issues: KpLessonReferenceIssue[];
}): void {
  const assetBlockIds = input.activeAssetsByObject.get(input.objectRef);
  if (assetBlockIds === undefined) {
    input.issues.push({
      path: input.path,
      message: `no lesson animation exposes ${input.objectRef}`,
      source: input.source
    });
    return;
  }
  input.focus.push({
    ownerId: input.ownerId,
    objectRef: input.objectRef,
    assetBlockIds: [...assetBlockIds],
    ...(input.source === undefined ? {} : { source: input.source })
  });
}

function assetKey(id: string, version: string): string {
  return `${id}@${version}`;
}
