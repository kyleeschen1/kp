import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";

/** Edit this trusted local file; the dev build publishes data, never its code. */
export const kpAuthoringMarketModelInput = Object.freeze({
  demandPriceIntercept: { numerator: "12", denominator: "1" },
  taxAmount: { numerator: "4", denominator: "1" }
} satisfies NonNullable<Parameters<typeof createKpAuthoredMarketSource>[0]["parameters"]>);
