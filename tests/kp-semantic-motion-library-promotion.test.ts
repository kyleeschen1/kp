import assert from "node:assert/strict";
import test from "node:test";

import {
  auditKpSemanticMotionLibraryPromotion,
  createKpSemanticMotionPromotionMatrix,
  kpSemanticMotionPromotionFixtures,
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
  assert.equal(report.matrixCellCount, 18);
  assert.deepEqual(report.complexityLevels, ["low", "medium", "high"]);
  assert.deepEqual(report.qualityTiers, ["full", "balanced", "efficient"]);
  assert.equal(report.gestaltStyleKeys.length, 2);
  assert.equal(report.hotPathLayoutReadBudget, 0);
  assert.equal(report.surpriseInitialLoadBudget, 0);
  assert.deepEqual(report.gaps, []);
});

test("promotion matrix preserves semantic identity across complexity quality and style", () => {
  const matrix = createKpSemanticMotionPromotionMatrix();

  kpSemanticMotionPromotionFixtures.forEach((fixture) => {
    const cells = matrix.filter((cell) => cell.fixtureId === fixture.id);
    assert.equal(cells.length, 6);
    assert.equal(new Set(cells.map((cell) => cell.semanticIdentity)).size, 1);
    assert.ok(cells.every((cell) => cell.styleCompatible));
    assert.ok(cells.every((cell) => cell.staticCostStatus === "accepted"));
  });
  assert.deepEqual(
    kpSemanticMotionPromotionFixtures.map((fixture) => fixture.complexity),
    ["low", "medium", "high"]
  );
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
