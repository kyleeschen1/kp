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
  integrity: "sha256:aabe5552ae410aec4d2aa4a51843eed3f847dcab19c1fa3df5c8fcdf9ede56c6",
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

export const kpArticleVignetteRegistry = Object.freeze([
  economicsDemandShiftVignetteRelease,
  economicsDemandShiftVignetteStaticRelease
]);
