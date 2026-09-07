import type { KpArticleImportLock } from "../../article/kp-article-import-lock.ts";
import { compileKpSupplyTaxScrollScoreArticle } from "../kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-article.ts";
import { restoreKpAuthoringMarketCompanion, KpAuthoringMarketCompanionError } from "./authoring-market-companion-runtime.ts";
export { KpAuthoringMarketCompanionError } from "./authoring-market-companion-runtime.ts";

/** Build/authoring entrance; production restores checked Article data instead. */
export function createKpAuthoringMarketCompanion(input:
  Omit<Parameters<typeof restoreKpAuthoringMarketCompanion>[0], "compiled"> & { readonly lock: KpArticleImportLock }
) {
  try {
    const compiled = compileKpSupplyTaxScrollScoreArticle({ text: input.text, lock: input.lock,
      ...(input.boundArticle === undefined ? {} : { sourceId: input.boundArticle.sourceId }) });
    return restoreKpAuthoringMarketCompanion({ ...input, compiled });
  } catch (cause) {
    if (cause instanceof KpAuthoringMarketCompanionError) throw cause;
    throw new KpAuthoringMarketCompanionError("article", "Repair the current Article references and import lock.", cause);
  }
}
