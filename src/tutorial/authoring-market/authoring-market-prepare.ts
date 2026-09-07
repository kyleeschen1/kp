import { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFacts } from "./authoring-market-facts.ts";
import { restoreKpAuthoringMarketCompanion, KpAuthoringMarketCompanionError } from "./authoring-market-companion-runtime.ts";
import type { KpAuthoredMarketSourceData, KpAuthoredMarketArticleProjection } from "./authoring-market-source-data.ts";

export class KpAuthoringMarketPresentationGap extends Error {
  readonly code = "kp.authoring.market-demand-motion-gap";
  readonly path = "specimen.demandPresentation";
  constructor() { super("This exemplar supports explicit settled demand history and tax motion only; animated demand needs its own governed operation and reviewed projection."); this.name = "KpAuthoringMarketPresentationGap"; }
}

/** Both delivery paths reconstruct local capabilities from data before DOM work. */
export function prepareKpAuthoredMarketSource(data: KpAuthoredMarketSourceData, article: KpAuthoredMarketArticleProjection) {
  if (data?.parameters == null || typeof data.parameters !== "object" ||
      !Object.hasOwn(data.parameters, "demandPriceIntercept") || !Object.hasOwn(data.parameters, "taxAmount")) {
    throw new Error("The local preview requires explicit demand and tax inputs; missing source is not a canonical default.");
  }
  if (data.specimen?.demandPresentation !== "settled-history") throw new KpAuthoringMarketPresentationGap();
  if (typeof data.specimen.id !== "string" || data.specimen.id.length === 0 || typeof data.specimen.title !== "string") {
    throw new Error("The author recipe requires an explicit specimen identity and title.");
  }
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", parameters: data.parameters });
  const facts = createKpAuthoringMarketFacts(authored);
  const boundArticle = Object.freeze({ ...data.article, facts });
  if (article.document.id !== "lesson.economics.supply-tax-scroll-score" || article.document.sourceId !== boundArticle.sourceId) {
    throw new KpAuthoringMarketCompanionError("article.identity", "Compiled Article must belong to this explicit source.");
  }
  const companion = restoreKpAuthoringMarketCompanion({ authored, text: boundArticle.text,
    boundArticle, compiled: { document: article.document } });
  for (const phrase of companion.scrollScore.phrases) {
    if (typeof article.phraseHtml[phrase.referenceAddress] !== "string") throw new Error(`Missing compiled phrase HTML: ${phrase.id}.`);
  }
  return Object.freeze({ authored, facts, boundArticle,
    companion: Object.freeze({ ...companion, stageFacts: facts.stageFacts, phraseHtml: article.phraseHtml }),
    specimen: Object.freeze({ ...data.specimen }) });
}
