import importLock from "../../../content/lessons/economics-supply-tax-scroll-score.kp.lock.json" with { type: "json" };
import type { KpArticleImportLock } from "../../article/kp-article-import-lock.ts";
import { compileKpSupplyTaxScrollScoreArticle } from "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-article.ts";
import { compileKpArticleMarkdownFragmentHtml } from "../../article/kp-article-static-html.ts";
import { prepareKpAuthoredMarketSource } from "../../tutorial/authoring-market/authoring-market-prepare.ts";
import type { KpAuthoringMarketPreviewData } from "./authoring-market-preview-protocol.ts";
export { KpAuthoringMarketPresentationGap } from "../../tutorial/authoring-market/authoring-market-prepare.ts";

/** Preview delivery compiles the draft; the reader restores the same checked inputs. */
export function prepareKpAuthoringMarketPreview(data: KpAuthoringMarketPreviewData) {
  const compiled = compileKpSupplyTaxScrollScoreArticle({ text: data.article.text,
    sourceId: data.article.sourceId, lock: importLock as KpArticleImportLock });
  const phraseHtml = Object.fromEntries(compiled.document.references.map(reference =>
    [reference.address, compileKpArticleMarkdownFragmentHtml(reference.label ?? "")]));
  return prepareKpAuthoredMarketSource(data, { document: compiled.document, phraseHtml });
}
