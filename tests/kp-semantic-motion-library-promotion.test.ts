import assert from "node:assert/strict";
import test from "node:test";

import {
  auditKpSemanticMotionLibraryPromotion,
  kpSemanticMotionPromotionRequirements
} from "../src/animation/semantic-motion-library-promotion.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";

test("semantic motion library passes its catalog-wide promotion contract", () => {
  const report = auditKpSemanticMotionLibraryPromotion();

  assert.equal(report.status, "promoted");
  assert.equal(report.requirementCount, 23);
  assert.ok(report.animationCount >= 15);
  assert.ok(report.transformationCount >= report.requirementCount);
  assert.ok(report.llmOperationCount >= report.requirementCount);
  assert.deepEqual(report.gaps, []);
});

test("promotion reports a missing operation family instead of silently narrowing scope", () => {
  const catalog = createKpAnimationAssets().map((animation) => ({
    ...animation,
    transformations: animation.transformations.filter(
      (transformation) => transformation.transformType !== "multiplyMatrices"
    )
  }));
  const report = auditKpSemanticMotionLibraryPromotion({ catalog });

  assert.equal(report.status, "blocked");
  assert.ok(report.gaps.includes("Missing promoted transformation type multiplyMatrices."));
});

test("promotion requirements never authorize generic replacement", () => {
  assert.ok(kpSemanticMotionPromotionRequirements.every(
    (requirement) => requirement.motifKind !== "artifact-replace"
  ));
});
