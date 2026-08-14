import {
  compileKpArticleAccessibilityManifest,
  type KpArticleAccessibilityManifest
} from "../../article/kp-article-accessibility.ts";
import {
  compileKpArticleDocument,
  type KpCompiledArticleDocument
} from "../../article/kp-article-document.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import {
  compileKpArticleStageManifests,
  type KpArticleStageManifest
} from "../../article/kp-article-stage-manifest.ts";
import {
  compileKpArticleStaticHtml,
  type KpArticleStaticHtmlArtifact
} from "../../article/kp-article-static-html.ts";
import {
  compileKpArticleStaticMarkdown,
  type KpArticleStaticMarkdownArtifact
} from "../../article/kp-article-static-markdown.ts";
import { kpNormalMatrixProofVignetteRegistry } from
  "../../article/vignettes/normal-matrix-proof-vignette.ts";

export const kpNormalMatrixProofArticleSourceId =
  "content/lessons/linear-algebra-normal-matrices.kp.md" as const;

export interface KpNormalMatrixProofArticleCompilation {
  readonly article: KpCompiledArticleDocument;
  readonly staticMarkdown: KpArticleStaticMarkdownArtifact;
  readonly staticHtml: KpArticleStaticHtmlArtifact;
  readonly stageManifests: readonly KpArticleStageManifest[];
  readonly accessibility: KpArticleAccessibilityManifest;
}

export function compileKpNormalMatrixProofArticle(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
}): KpNormalMatrixProofArticleCompilation {
  const article = compileKpArticleDocument({
    source: createKpArticleSource(kpNormalMatrixProofArticleSourceId, input.text),
    registry: kpNormalMatrixProofVignetteRegistry,
    lock: input.lock
  });
  return Object.freeze({
    article,
    staticMarkdown: compileKpArticleStaticMarkdown(article.document),
    staticHtml: compileKpArticleStaticHtml(article.document),
    stageManifests: compileKpArticleStageManifests(article.document),
    accessibility: compileKpArticleAccessibilityManifest(article.document)
  });
}
