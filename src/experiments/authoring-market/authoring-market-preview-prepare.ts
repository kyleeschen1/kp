import importLock from "../../../content/lessons/economics-supply-tax-scroll-score.kp.lock.json" with { type: "json" };
import type { KpArticleImportLock } from "../../article/kp-article-import-lock.ts";
import { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFacts } from "./authoring-market-facts.ts";
import { createKpAuthoringMarketCompanion } from "./authoring-market-companion.ts";
import type { KpAuthoringMarketPreviewData } from "./authoring-market-preview-protocol.ts";

/** Reconstruct local capabilities from data and verify before touching the DOM. */
export function prepareKpAuthoringMarketPreview(data: KpAuthoringMarketPreviewData) {
  if (data?.parameters == null || typeof data.parameters !== "object" ||
      !Object.hasOwn(data.parameters, "demandPriceIntercept") || !Object.hasOwn(data.parameters, "taxAmount")) {
    throw new Error("The local preview requires explicit demand and tax inputs; missing source is not a canonical default.");
  }
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", parameters: data.parameters });
  const facts = createKpAuthoringMarketFacts(authored);
  const boundArticle = Object.freeze({ ...data.article, facts });
  const companion = createKpAuthoringMarketCompanion({ authored, text: boundArticle.text,
    boundArticle, lock: importLock as KpArticleImportLock });
  return Object.freeze({ authored, facts, boundArticle, companion });
}
