import { createKpVignetteRelease } from "../kp-article-import-lock.ts";
import { KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID } from
  "../../animation/economics-supply-tax-asset.ts";

export const economicsSupplyTaxVignetteRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.economics.supply-tax-welfare",
  version: "1.0.0",
  integrity: "sha256:23c61d1971f7a006cc3e78bad613bca1e975171dc34932a90ee4b3326c2c9b9c",
  moduleSpecifier: "../../animation/economics-supply-tax-asset.ts",
  animationId: KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID,
  objectPaths: [
    "authority",
    "consumer-price",
    "consumer-surplus-taxed",
    "consumer-surplus-untaxed",
    "deadweight-loss",
    "demand",
    "government-revenue",
    "producer-price",
    "producer-surplus-taxed",
    "producer-surplus-untaxed",
    "supply",
    "tax",
    "taxed-equilibrium",
    "taxed-supply",
    "untaxed-equilibrium",
    "untaxed-price",
    "wedge"
  ],
  transitionPaths: ["impose-tax"],
  checkpointPaths: [
    "baseline-market",
    "tax-input",
    "supply-translation",
    "price-wedge",
    "quantity-contraction",
    "surplus-redistribution",
    "government-revenue",
    "deadweight-loss"
  ],
  accessibility: {
    accessibleName: "Per-unit tax supply, demand, and welfare figure",
    semanticSummary: "A four-dollar per-unit tax shifts buyer-facing supply, lowers traded quantity, separates consumer and producer prices, transfers revenue, and creates deadweight loss.",
    reducedMotion: "direct-checkpoint-seek"
  }
});

/** This registry remains exemplar-local until the visual checkpoint approves it. */
export const kpEconomicsSupplyTaxVignetteRegistry = Object.freeze([
  economicsSupplyTaxVignetteRelease
]);
