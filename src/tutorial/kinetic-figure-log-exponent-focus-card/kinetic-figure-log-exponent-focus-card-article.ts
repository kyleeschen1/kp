import {
  compileKpArticleDocument,
  type KpCompiledArticleDocument
} from "../../article/kp-article-document.ts";
import type { KpArticleImportLock } from
  "../../article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { kpLogExponentFocusCardVignetteRegistry } from
  "../../article/vignettes/log-exponent-vignette.ts";

export const kpLogExponentFocusCardArticleSourceId =
  "content/lessons/algebra-log-exponent-focus-card.kp.md" as const;

export function compileKpLogExponentFocusCardArticle(input: {
  readonly text: string;
  readonly lock: KpArticleImportLock;
}): KpCompiledArticleDocument {
  const article = compileKpArticleDocument({
    source: createKpArticleSource(kpLogExponentFocusCardArticleSourceId,
      input.text),
    registry: kpLogExponentFocusCardVignetteRegistry,
    lock: input.lock
  });
  if (article.document.id !== "lesson.algebra.log-exponent-focus-card") {
    throw new Error("Log-exponent Focus Deck requires its canonical Article source.");
  }
  return article;
}
