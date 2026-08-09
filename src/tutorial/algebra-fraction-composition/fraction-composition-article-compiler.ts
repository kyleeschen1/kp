import {
  compileKpArticleAccessibilityManifest,
  type KpArticleAccessibilityManifest
} from "../../article/kp-article-accessibility.ts";
import {
  deriveKpArticleDeck,
  type KpArticleDeck
} from "../../article/kp-article-deck.ts";
import {
  compileKpArticleDocument,
  type KpCompiledArticleDocument
} from "../../article/kp-article-document.ts";
import type {
  KpArticleImportLock
} from "../../article/kp-article-import-lock.ts";
import {
  createKpArticleSource
} from "../../article/kp-article-source.ts";
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
import {
  kpFractionCompositionArticleVignetteRegistry
} from "../../article/vignettes/fraction-composition-vignette.ts";

export const kpFractionCompositionArticleSourceId =
  "content/lessons/algebra-fraction-composition.kp.md" as const;

export interface KpFractionCompositionArticleCompilation {
  readonly article: KpCompiledArticleDocument;
  readonly staticMarkdown: KpArticleStaticMarkdownArtifact;
  readonly staticHtml: KpArticleStaticHtmlArtifact;
  readonly stageManifests: readonly KpArticleStageManifest[];
  readonly deck: KpArticleDeck;
  readonly accessibility: KpArticleAccessibilityManifest;
}

/**
 * The algebra caller composes existing Article v1 projections directly. It
 * owns no compatibility passage model and cannot reinterpret the solve trace.
 */
export function compileKpFractionCompositionArticle(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
}): KpFractionCompositionArticleCompilation {
  const article = compileKpArticleDocument({
    source: createKpArticleSource(kpFractionCompositionArticleSourceId, input.text),
    registry: kpFractionCompositionArticleVignetteRegistry,
    lock: input.lock
  });
  return Object.freeze({
    article,
    staticMarkdown: compileKpArticleStaticMarkdown(article.document),
    staticHtml: compileKpArticleStaticHtml(article.document),
    stageManifests: compileKpArticleStageManifests(article.document),
    deck: deriveKpArticleDeck(article.document),
    accessibility: compileKpArticleAccessibilityManifest(article.document)
  });
}
