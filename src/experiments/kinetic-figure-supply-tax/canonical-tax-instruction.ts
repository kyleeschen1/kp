import { createKpPerUnitTaxWelfareModel } from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import { prepareKpAuthoringMarketPreview as prepareKpAuthoredMarketSource } from "../authoring-market/authoring-market-preview-prepare.ts";
import type { KpAuthoringMarketPreviewData } from "../authoring-market/authoring-market-preview-protocol.ts";
import { createKpSupplyTaxPedagogicalScore } from "../../tutorial/kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import { kpSupplyTaxScrollScoreArticleSourceId } from "../../tutorial/kinetic-figure-supply-tax-scroll-score/kinetic-figure-supply-tax-scroll-score-article.ts";

export class KpCanonicalTaxInstructionGap extends Error {
  readonly code = "kp.authoring.canonical-tax-instruction-gap";
  readonly path = "canonical.article.modelRevision";
  constructor() {
    super("The preserved canonical Article teaches the reference market. A different model needs explicitly revised and reviewed instruction; use the parameter-bound authoring preview meanwhile.");
    this.name = "KpCanonicalTaxInstructionGap";
  }
}

/** Bind the reviewed literal Article, not a second copy of its prose template. */
export function bindKpCanonicalTaxInstruction(data: KpAuthoringMarketPreviewData, text: string): KpAuthoringMarketPreviewData {
  const prepared = prepareKpAuthoredMarketSource(data);
  const authority = prepared.authored.source.canonical;
  // This is a build-time preservation check, never a reader fallback sampler.
  // Free prose cannot be relabelled as valid for a changed economic revision.
  if (JSON.stringify(authority.semantics.model.input) !== JSON.stringify(createKpPerUnitTaxWelfareModel().input)) {
    throw new KpCanonicalTaxInstructionGap();
  }
  const score = createKpSupplyTaxPedagogicalScore(authority);
  const claims = Object.fromEntries(score.beats.map(beat => [beat.slug, beat.claim])) as typeof data.article.claims;
  const bound = { ...data, article: { ...data.article, text, claims,
    sourceId: kpSupplyTaxScrollScoreArticleSourceId,
    authoredSourcePath: kpSupplyTaxScrollScoreArticleSourceId,
    modelRevisionId: prepared.facts.modelRevisionId } };
  prepareKpAuthoredMarketSource(bound);
  return bound;
}
