import importLock from "../../../content/lessons/economics-supply-tax-scroll-score.kp.lock.json" with { type: "json" };
import type { KpArticleImportLock } from "../../article/kp-article-import-lock.ts";
import { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFacts } from "./authoring-market-facts.ts";
import { createKpAuthoringMarketCompanion } from "./authoring-market-companion.ts";
import type { KpAuthoringMarketPreviewData } from "./authoring-market-preview-protocol.ts";

export class KpAuthoringMarketPresentationGap extends Error {
  readonly code = "kp.authoring.market-demand-motion-gap";
  readonly path = "specimen.demandPresentation";
  constructor() { super("This exemplar supports explicit settled demand history and tax motion only; animated demand needs its own governed operation and reviewed projection."); this.name = "KpAuthoringMarketPresentationGap"; }
}

/** Both delivery paths reconstruct local capabilities from data before DOM work. */
export function prepareKpAuthoredMarketSource(data: KpAuthoringMarketPreviewData) {
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
  const companion = createKpAuthoringMarketCompanion({ authored, text: boundArticle.text,
    boundArticle, lock: importLock as KpArticleImportLock });
  return Object.freeze({ authored, facts, boundArticle,
    companion: Object.freeze({ ...companion, stageFacts: facts.stageFacts }),
    specimen: Object.freeze({ ...data.specimen }) });
}
