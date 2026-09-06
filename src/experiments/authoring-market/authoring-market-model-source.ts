import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import type { KpAuthoringMarketPreviewData } from "./authoring-market-preview-protocol.ts";

type MarketParameters = NonNullable<Parameters<typeof createKpAuthoredMarketSource>[0]["parameters"]>;

/** Two explicit author recipes share the same assembly and tax projection. */
export const kpAuthoringMarketSpecimens = Object.freeze({
  reference: {
    specimen: { id: "specimen.market.reference", title: "Reference market", demandPresentation: "settled-history" },
    parameters: {
      demandPriceIntercept: { numerator: "12", denominator: "1" },
      taxAmount: { numerator: "4", denominator: "1" }
    }
  },
  variation: {
    specimen: { id: "specimen.market.demand-then-tax", title: "Demand change, then tax", demandPresentation: "settled-history" },
    parameters: {
      demandPriceIntercept: { numerator: "14", denominator: "1" },
      taxAmount: { numerator: "2", denominator: "1" }
    }
  }
} satisfies Record<string, { specimen: KpAuthoringMarketPreviewData["specimen"]; parameters: MarketParameters }>);

// Edit this selection or the recipe above in the local editor, then save.
export const kpAuthoringMarketSelectedSpecimen: keyof typeof kpAuthoringMarketSpecimens = "reference";
export const kpAuthoringMarketModelInput = kpAuthoringMarketSpecimens[kpAuthoringMarketSelectedSpecimen].parameters;
