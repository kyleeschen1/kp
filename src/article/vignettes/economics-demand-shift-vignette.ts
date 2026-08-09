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

export const kpArticleVignetteRegistry = Object.freeze([
  economicsDemandShiftVignetteRelease
]);
