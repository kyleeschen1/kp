import { createKpVignetteRelease } from "../kp-article-import-lock.ts";
import { KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID } from
  "../../animation/economics-supply-tax-asset.ts";

const supplyTaxAccessibility = {
  accessibleName: "Per-unit tax supply, demand, and welfare figure",
  semanticSummary: "A four-dollar per-unit tax shifts buyer-facing supply, lowers traded quantity, separates consumer and producer prices, transfers revenue, and creates deadweight loss.",
  reducedMotion: "direct-checkpoint-seek" as const
};

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
  accessibility: supplyTaxAccessibility
});

export const economicsSupplyTaxStaticVignetteRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.economics.supply-tax-welfare",
  version: "1.1.0",
  integrity: "sha256:7495544318b1a867c0bb51db6033deb948a2d62ee868955c615241e31c49ea33",
  moduleSpecifier: "../../animation/economics-supply-tax-asset.ts",
  animationId: KP_ECONOMICS_SUPPLY_TAX_ANIMATION_ID,
  objectPaths: economicsSupplyTaxVignetteRelease.objectPaths,
  transitionPaths: economicsSupplyTaxVignetteRelease.transitionPaths,
  checkpointPaths: economicsSupplyTaxVignetteRelease.checkpointPaths,
  accessibility: supplyTaxAccessibility,
  staticProjection: {
    checkpoints: [{
      id: "baseline-market",
      label: "Untaxed market",
      alt: "Demand and original supply intersect at five units and a price of seven before the tax.",
      caption: "The untaxed market clears at Q equals 5 and P equals 7.",
      assetPath: "./kp-static/economics-supply-tax-baseline.svg"
    }, {
      id: "supply-translation",
      label: "Market after a per-unit tax",
      alt: "Buyer-facing supply is four dollars above original supply while demand clears at three units; consumers pay nine and producers receive five.",
      caption: "A four-dollar tax lowers quantity to 3 and separates the consumer and producer prices.",
      assetPath: "./kp-static/economics-supply-tax-taxed.svg"
    }],
    transitions: [{
      id: "impose-tax",
      from: "baseline-market",
      to: "supply-translation"
    }]
  }
});

/** This registry remains exemplar-local until the visual checkpoint approves it. */
export const kpEconomicsSupplyTaxVignetteRegistry = Object.freeze([
  economicsSupplyTaxVignetteRelease,
  economicsSupplyTaxStaticVignetteRelease
]);
