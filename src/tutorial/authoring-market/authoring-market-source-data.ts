import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import type { KpSupplyTaxPedagogicalBeatV1 } from "../kinetic-figure-supply-tax/kinetic-figure-supply-tax-score.ts";
import type { KpArticleDocument } from "../../article/kp-article-document.ts";

/** Portable inputs, independent of author templates and preview revision transport. */
export interface KpAuthoredMarketSourceData {
  readonly specimen: { readonly id: string; readonly title: string; readonly demandPresentation: "settled-history" };
  readonly parameters: NonNullable<Parameters<typeof createKpAuthoredMarketSource>[0]["parameters"]>;
  readonly article: {
    readonly text: string;
    readonly claims: Readonly<Record<KpSupplyTaxPedagogicalBeatV1["slug"], string>>;
    readonly sourceId: string;
    readonly authoredSourcePath: string;
    readonly modelRevisionId: string;
  };
}

/** Checked build output; source maps and compiler implementations stay with authoring. */
export interface KpAuthoredMarketArticleProjection {
  readonly document: KpArticleDocument;
  readonly phraseHtml: Readonly<Record<string, string>>;
}
