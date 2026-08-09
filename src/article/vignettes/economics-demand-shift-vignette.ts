import { createKpVignetteRelease } from "../kp-article-import-lock.ts";

export const economicsDemandShiftVignetteRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.economics.demand-shift",
  version: "1.0.0",
  integrity: "sha256:aac10ec8a22ccb27294b7ec48d7f3ce365950740083467f61e4892f2ffd18088",
  moduleSpecifier:
    "../../tutorial/economics-demand-shift/economics-demand-shift-animation-capability.ts",
  animationId: "animation.economics.supply-demand-equilibrium-shift",
  objectPaths: [
    "axes",
    "demand",
    "equilibrium",
    "price-axis",
    "quantity-axis",
    "supply"
  ],
  transitionPaths: ["shift-demand"],
  checkpointPaths: ["initial", "settled"]
});

export const economicsDemandShiftVignetteStaticRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.economics.demand-shift",
  version: "1.1.0",
  integrity: "sha256:c21624c64a35a5e26302639ffe8c1a3b89ab6a3dc447a5f3b0dfc75ad26bb393",
  moduleSpecifier:
    "../../tutorial/economics-demand-shift/economics-demand-shift-animation-capability.ts",
  animationId: "animation.economics.supply-demand-equilibrium-shift",
  objectPaths: [
    "axes",
    "demand",
    "equilibrium",
    "price-axis",
    "quantity-axis",
    "supply"
  ],
  transitionPaths: ["shift-demand"],
  checkpointPaths: ["initial", "settled"],
  accessibility: {
    accessibleName: "Supply and demand equilibrium graph",
    semanticSummary: "A supply curve stays fixed while demand shifts right, moving equilibrium to a higher price and quantity.",
    reducedMotion: "direct-checkpoint-seek"
  },
  staticProjection: {
    checkpoints: [
      {
        id: "initial",
        label: "Initial equilibrium",
        alt: "Supply and initial demand intersect at the initial market equilibrium.",
        caption: "Initial supply and demand equilibrium before demand increases.",
        assetPath: "./kp-static/economics-demand-shift-initial.svg"
      },
      {
        id: "settled",
        label: "New equilibrium",
        alt: "Supply and shifted demand intersect at a higher price and quantity.",
        caption: "New market equilibrium after demand increases while supply remains fixed.",
        assetPath: "./kp-static/economics-demand-shift-settled.svg"
      }
    ],
    transitions: [{ id: "shift-demand", from: "initial", to: "settled" }]
  }
});

export const economicsDemandShiftVignetteArticleRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.economics.demand-shift",
  version: "1.2.0",
  integrity: "sha256:2a423d136242a919f7e92cdbaea147536693fd96b45b5d2d5ba105d0e673c69e",
  moduleSpecifier:
    "../../tutorial/economics-demand-shift/economics-demand-shift-animation-capability.ts",
  animationId: "animation.economics.supply-demand-equilibrium-shift",
  objectPaths: [
    "axes",
    "demand",
    "equilibrium",
    "price-axis",
    "quantity-axis",
    "supply"
  ],
  transitionPaths: ["shift-demand", "trace-supply-movement"],
  checkpointPaths: ["initial", "settled", "verified"],
  accessibility: {
    accessibleName: "Supply and demand equilibrium graph",
    semanticSummary: "A supply curve stays fixed while demand shifts right, moving equilibrium to a higher price and quantity.",
    reducedMotion: "direct-checkpoint-seek"
  },
  staticProjection: {
    checkpoints: [
      {
        id: "initial",
        label: "Initial equilibrium",
        alt: "Supply and initial demand intersect at the initial market equilibrium.",
        caption: "Initial supply and demand equilibrium before demand increases.",
        assetPath: "./kp-static/economics-demand-shift-initial.svg"
      },
      {
        id: "settled",
        label: "New equilibrium",
        alt: "Supply and shifted demand intersect at a higher price and quantity.",
        caption: "New market equilibrium after demand increases while supply remains fixed.",
        assetPath: "./kp-static/economics-demand-shift-settled.svg"
      },
      {
        id: "verified",
        label: "Movement along unchanged supply",
        alt: "The initial and new equilibria lie at different points on the same supply curve.",
        caption: "Quantity supplied changes by moving along the unchanged supply relationship.",
        assetPath: "./kp-static/economics-demand-shift-settled.svg"
      }
    ],
    transitions: [
      { id: "shift-demand", from: "initial", to: "settled" },
      { id: "trace-supply-movement", from: "settled", to: "verified" }
    ]
  }
});

export const kpArticleVignetteRegistry = Object.freeze([
  economicsDemandShiftVignetteRelease,
  economicsDemandShiftVignetteStaticRelease
]);
