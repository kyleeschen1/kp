import { createKpVignetteRelease } from "../kp-article-import-lock.ts";
import { kpLogExponentAnimationId } from
  "../../animation/log-exponent-adapter.ts";

export const kpLogExponentFocusCardVignetteRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.algebra.log-exponent-solve",
  version: "1.0.0",
  integrity:
    "sha256:dce14bb5e9c7f51f43162030fa0a22c9d3a3e08a1b4ef8c9bd15bb885f2d307c",
  moduleSpecifier: "../../animation/log-exponent-adapter.ts",
  animationId: kpLogExponentAnimationId,
  objectPaths: [
    "extracted-equation",
    "logged-equation",
    "logged-power",
    "solved-equation",
    "source-equation",
    "source-exponent"
  ],
  transitionPaths: [
    "apply-log-both-sides",
    "divide-by-log-base",
    "extract-exponent"
  ],
  checkpointPaths: [
    "source",
    "logged-both-sides",
    "exponent-extracted",
    "solved"
  ],
  accessibility: {
    accessibleName: "Solve two to the x equals seven with logarithms",
    semanticSummary:
      "Apply natural logarithms to both sides, use the logarithm power law, and divide by the logarithm of two to isolate x.",
    reducedMotion: "direct-checkpoint-seek"
  }
});

/** Exemplar-local until the two-card Focus Deck checkpoint is approved. */
export const kpLogExponentFocusCardVignetteRegistry = Object.freeze([
  kpLogExponentFocusCardVignetteRelease
]);
