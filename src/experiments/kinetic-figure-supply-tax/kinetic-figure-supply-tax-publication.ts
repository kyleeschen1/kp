import { compileKpArticleAccessibilityManifest } from
  "../../article/kp-article-accessibility.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { compileKpArticleStaticHtml } from
  "../../article/kp-article-static-html.ts";
import {
  compileKpSupplyTaxArticle,
  type KpCompiledSupplyTaxArticleV1
} from "./kinetic-figure-supply-tax-article.ts";

export interface KpSupplyTaxStaticPublicationV1 {
  readonly kind: "kp.economics.supply-tax-static-publication.v1";
  readonly compiled: KpCompiledSupplyTaxArticleV1;
  readonly articleHtml: string;
  readonly tocHtml: string;
  readonly staticAssets: ReturnType<typeof compileKpArticleStaticHtml>["assets"];
  readonly math: ReturnType<typeof compileKpArticleStaticHtml>["math"];
  readonly accessibility: ReturnType<typeof compileKpArticleAccessibilityManifest>;
}

/**
 * Searchable publication is derived before any interactive host exists. This
 * keeps native browser find and no-JavaScript reading properties of Article
 * source, rather than reconstructing them from a client-side deck.
 */
export function compileKpSupplyTaxStaticPublication(input: {
  readonly articleText: string;
  readonly importLock: KpArticleImportLock;
}): KpSupplyTaxStaticPublicationV1 {
  const compiled = compileKpSupplyTaxArticle({
    text: input.articleText,
    lock: input.importLock
  });
  const staticHtml = compileKpArticleStaticHtml(compiled.article.document);
  const accessibility = compileKpArticleAccessibilityManifest(
    compiled.article.document
  );
  return Object.freeze({
    kind: "kp.economics.supply-tax-static-publication.v1" as const,
    compiled,
    articleHtml: staticHtml.articleHtml,
    tocHtml: staticHtml.tocHtml,
    staticAssets: staticHtml.assets,
    math: staticHtml.math,
    accessibility
  });
}
