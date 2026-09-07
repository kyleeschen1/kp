import {
  compileKpArticleDocument,
  type KpCompiledArticleDocument
} from "../../article/kp-article-document.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { kpEconomicsSupplyTaxVignetteRegistry } from
  "../../article/vignettes/economics-supply-tax-vignette.ts";

export const kpSupplyTaxScrollScoreArticleSourceId =
  "content/lessons/economics-supply-tax-scroll-score.kp.md" as const;

export function compileKpSupplyTaxScrollScoreArticle(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
  readonly sourceId?: string;
}): KpCompiledArticleDocument {
  const article = compileKpArticleDocument({
    source: createKpArticleSource(input.sourceId ?? kpSupplyTaxScrollScoreArticleSourceId,
      input.text),
    registry: kpEconomicsSupplyTaxVignetteRegistry,
    lock: input.lock
  });
  if (article.document.id !== "lesson.economics.supply-tax-scroll-score") {
    throw new Error("Scroll Score Station requires its canonical Article source.");
  }
  return article;
}
