import type {
  KpArticleBlock,
  KpArticleDocument,
  KpArticleMotionBlock,
  KpArticleStageBlock
} from "./kp-article-document.ts";
import { scanKpArticleMarkdownLinks } from "./kp-article-markdown-links.ts";
import { createKpArticleSource } from "./kp-article-source.ts";
import type {
  KpVignetteRelease,
  KpVignetteStaticCheckpoint
} from "./kp-article-import-lock.ts";

export interface KpArticleStaticAssetRequest {
  readonly id: string;
  readonly stageId: string;
  readonly vignetteId: string;
  readonly vignetteVersion: string;
  readonly vignetteIntegrity: `sha256:${string}`;
  readonly checkpointId: string;
  readonly assetPath: string;
  readonly alt: string;
  readonly caption: string;
}

export interface KpArticleStaticMarkdownArtifact {
  readonly kind: "kp-article-static-markdown";
  readonly documentId: string;
  readonly markdown: string;
  readonly assets: readonly KpArticleStaticAssetRequest[];
}

export function compileKpArticleStaticMarkdown(
  document: KpArticleDocument
): KpArticleStaticMarkdownArtifact {
  const stages = new Map(document.blocks.flatMap((block) => (
    block.kind === "stage" ? [[block.id, block] as const] : []
  )));
  const assets = new Map<string, KpArticleStaticAssetRequest>();
  const sections = document.blocks.map((block) => compileBlock(document, block, stages, assets));
  return Object.freeze({
    kind: "kp-article-static-markdown" as const,
    documentId: document.id,
    markdown: `${sections.filter((section) => section.trim().length > 0).join("\n\n").trim()}\n`,
    assets: Object.freeze([...assets.values()])
  });
}

function compileBlock(
  document: KpArticleDocument,
  block: KpArticleBlock,
  stages: ReadonlyMap<string, KpArticleStageBlock>,
  assets: Map<string, KpArticleStaticAssetRequest>
): string {
  switch (block.kind) {
    case "markdown":
      return rewriteSemanticLinks(document, block.markdown);
    case "stage": {
      const checkpoint = initialCheckpoint(block.vignette);
      return [
        identityAnchor(block.id),
        ...block.vignette.objectPaths.map((path) => semanticAnchor(block.id, path)),
        renderFigure(block, checkpoint, assets)
      ].join("\n");
    }
    case "passage":
    case "focus":
      return [
        identityAnchor(block.id),
        rewriteSemanticLinks(document, block.markdown)
      ].join("\n\n");
    case "motion": {
      const stage = stages.get(block.stageId);
      if (stage === undefined) throw new Error(`Static motion ${block.id} references missing stage ${block.stageId}.`);
      const checkpoint = motionTargetCheckpoint(block, stage.vignette);
      return [
        identityAnchor(block.id),
        rewriteSemanticLinks(document, block.beforeMarkdown),
        renderFigure(stage, checkpoint, assets),
        ...(block.afterMarkdown === undefined
          ? []
          : [rewriteSemanticLinks(document, block.afterMarkdown)])
      ].join("\n\n");
    }
  }
}

function initialCheckpoint(release: KpVignetteRelease): KpVignetteStaticCheckpoint {
  const projection = requireStaticProjection(release);
  const initialId = projection.transitions[0]?.from ?? projection.checkpoints[0]?.id;
  const checkpoint = projection.checkpoints.find(({ id }) => id === initialId);
  if (checkpoint === undefined) throw new Error(`${release.id}@${release.version} has no initial static checkpoint.`);
  return checkpoint;
}

function motionTargetCheckpoint(
  motion: KpArticleMotionBlock,
  release: KpVignetteRelease
): KpVignetteStaticCheckpoint {
  const projection = requireStaticProjection(release);
  const transition = motion.transition;
  const targetId = transition.kind === "range"
    ? objectPath(transition.to)
    : projection.transitions.find(({ id }) => id === objectPath(transition.path))?.to;
  const checkpoint = projection.checkpoints.find(({ id }) => id === targetId);
  if (checkpoint === undefined) {
    throw new Error(`${release.id}@${release.version} lacks a static target for motion ${motion.id}.`);
  }
  return checkpoint;
}

function requireStaticProjection(release: KpVignetteRelease) {
  if (release.staticProjection === undefined) {
    throw new Error(`${release.id}@${release.version} does not provide a static checkpoint projection.`);
  }
  return release.staticProjection;
}

function renderFigure(
  stage: KpArticleStageBlock,
  checkpoint: KpVignetteStaticCheckpoint,
  assets: Map<string, KpArticleStaticAssetRequest>
): string {
  const assetId = `${stage.id}:${checkpoint.id}`;
  if (!assets.has(assetId)) {
    assets.set(assetId, Object.freeze({
      id: assetId,
      stageId: stage.id,
      vignetteId: stage.vignette.id,
      vignetteVersion: stage.vignette.version,
      vignetteIntegrity: stage.vignette.integrity,
      checkpointId: checkpoint.id,
      assetPath: checkpoint.assetPath,
      alt: checkpoint.alt,
      caption: checkpoint.caption
    }));
  }
  return [
    semanticAnchor(stage.id, checkpoint.id),
    `![${escapeLabel(checkpoint.alt)}](${checkpoint.assetPath} "${escapeTitle(checkpoint.label)}")`,
    `*${checkpoint.caption}*`
  ].join("\n\n");
}

function rewriteSemanticLinks(document: KpArticleDocument, markdown: string): string {
  if (!markdown.includes("kp-ref:")) return markdown.trim();
  const source = createKpArticleSource(`${document.sourceId}#static-fragment`, markdown);
  const references = new Map(document.references.map((reference) => [reference.address, reference]));
  const edits = scanKpArticleMarkdownLinks(source).flatMap((link) => {
    if (!link.url.startsWith("kp-ref:")) return [];
    const address = link.url.slice("kp-ref:".length);
    const reference = references.get(address);
    if (reference === undefined) throw new Error(`Static Markdown cannot resolve semantic link ${address}.`);
    return [{ start: link.destinationSpan.start.offset, end: link.destinationSpan.end.offset, value: `#${reference.staticFragment}` }];
  }).sort((left, right) => right.start - left.start);
  let rewritten = markdown;
  for (const edit of edits) {
    rewritten = `${rewritten.slice(0, edit.start)}${edit.value}${rewritten.slice(edit.end)}`;
  }
  return rewritten.trim();
}

function objectPath(fullId: string): string {
  const address = fullId.slice(fullId.indexOf("#") + 1);
  return address.slice(address.indexOf("/") + 1);
}

function identityAnchor(id: string): string {
  return `<a id="${id}"></a>`;
}

function semanticAnchor(stageId: string, path: string): string {
  return `<a id="kp-ref:${stageId}/${path}"></a>`;
}

function escapeLabel(value: string): string {
  return value.replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function escapeTitle(value: string): string {
  return value.replaceAll('"', '\\"');
}
