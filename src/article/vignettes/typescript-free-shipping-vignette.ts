import {
  compileKpCanonicalAnimationConstruction
} from "../../authoring/canonical-animation-public-api.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../../semantic/typescript-free-shipping-animation-asset.ts";
import { createKpVignetteRelease } from "../kp-article-import-lock.ts";

const exemplar = createKpTypeScriptFreeShippingAnimationAsset();

export const kpTypeScriptFreeShippingConstruction =
  compileKpCanonicalAnimationConstruction({
    animation: exemplar.animation,
    constructionId: "construction.typescript.free-shipping-threshold",
    sourceId: exemplar.semantics.contractId,
    revisionId: exemplar.semantics.revisions[1]!.revisionId,
    operationPacks: [{
      packId: "project.typescript-refactor",
      version: "1.0.0"
    }]
  });

export const kpTypeScriptFreeShippingVignetteRelease = createKpVignetteRelease({
  schemaVersion: "kp.vignette-release.v1",
  id: "vignette.programming.typescript-free-shipping",
  version: "1.0.0",
  integrity: "sha256:afc9ddf7ad2e6d5481485365e7501d101f7681e4df2d7506d0e4504fd9889376",
  moduleSpecifier: "../../semantic/typescript-free-shipping-animation-asset.ts",
  animationId: exemplar.animation.id,
  objectPaths: [
    "duplicated-program",
    "shipping-cost-rule",
    "shipping-message-rule",
    "named-helper",
    "shipping-cost-call",
    "shipping-message-call",
    "refactored-program"
  ],
  transitionPaths: [
    "extract-shared-rule",
    "replace-cost-call",
    "replace-message-call",
    "verify-parity"
  ],
  checkpointPaths: exemplar.score.stages.map(({ id }) => id.replace("stage.", "")),
  accessibility: {
    accessibleName: exemplar.accessibility.title,
    semanticSummary: exemplar.accessibility.description,
    reducedMotion: "direct-checkpoint-seek"
  }
});

export const kpTypeScriptFreeShippingVignetteRegistry = Object.freeze([
  kpTypeScriptFreeShippingVignetteRelease
]);
