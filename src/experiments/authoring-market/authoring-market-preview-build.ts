import { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import { createKpAuthoringMarketFacts } from "./authoring-market-facts.ts";
import { authorKpMarketArticle } from "./authoring-market-article-source.ts";
import { kpAuthoringMarketModelInput } from "./authoring-market-model-source.ts";
import { prepareKpAuthoringMarketPreview } from "./authoring-market-preview-prepare.ts";
import type { KpAuthoringMarketPreviewData } from "./authoring-market-preview-protocol.ts";

/** Vite's trusted local server module entrance. No source code crosses the wire. */
export function buildKpAuthoringMarketPreview(): KpAuthoringMarketPreviewData {
  const authored = createKpAuthoredMarketSource({ kind: "impose-per-unit-tax", parameters: kpAuthoringMarketModelInput });
  const { facts: _facts, ...article } = authorKpMarketArticle(createKpAuthoringMarketFacts(authored));
  const data = { parameters: kpAuthoringMarketModelInput, article };
  prepareKpAuthoringMarketPreview(data);
  return data;
}
