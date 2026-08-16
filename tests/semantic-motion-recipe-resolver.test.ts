import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpResolvedSemanticMotionRecipe,
  kpSemanticMotionRecipeCapabilityMatrix,
  resolveKpSemanticMotionRecipe,
  type KpSemanticMotionOperationStructureContract,
} from "../src/domain-ir/public-api.ts";
import {
  cancellationSemanticMotionPrecedenceSpec,
  cancellationSemanticMotionStructureContract,
  compileSemanticMotionPrecedenceFixture,
  createCancellationSemanticMotionFixture,
  createDistributionSemanticMotionFixture,
  createQuotientSemanticMotionFixture,
  createSequentialSemanticMotionFixture,
  distributionSemanticMotionPrecedenceSpec,
  distributionSemanticMotionStructureContract,
  quotientSemanticMotionPrecedenceSpec,
  quotientSemanticMotionStructureContract
} from "./fixtures/semantic-motion-compiler-fixtures.ts";

test("three contrasting operation shapes resolve within the closed capability recipes", () => {
  const cases = [
    [createQuotientSemanticMotionFixture(), quotientSemanticMotionStructureContract(), quotientSemanticMotionPrecedenceSpec(), "recipe.semantic-motion.log-quotient-fusion.v1"],
    [createDistributionSemanticMotionFixture(), distributionSemanticMotionStructureContract(), distributionSemanticMotionPrecedenceSpec(), "recipe.semantic-motion.distribution-fan-out.v1"],
    [createCancellationSemanticMotionFixture(), cancellationSemanticMotionStructureContract(), cancellationSemanticMotionPrecedenceSpec(), "recipe.semantic-motion.inverse-cancellation.v1"]
  ] as const;
  const capabilitySignatures = new Set<string>();
  for (const [fixture, contract, spec, recipeId] of cases) {
    const precedence = compileSemanticMotionPrecedenceFixture(fixture, contract, spec);
    const result = resolveKpSemanticMotionRecipe(precedence);
    assert.equal(result.status, "resolved");
    if (result.status !== "resolved") continue;
    assert.equal(result.resolution.recipeId, recipeId);
    assert.equal(isKpResolvedSemanticMotionRecipe(result.resolution), true);
    assert.strictEqual(result.resolution.precedence, precedence);
    capabilitySignatures.add(result.resolution.capabilityIds.join("|"));
    assert.doesNotMatch(JSON.stringify(result.resolution), /fade|opacity|renderer|duration|easing|path|geometry/i);
  }
  assert.equal(capabilitySignatures.size, 3);
  assert.deepEqual(
    kpSemanticMotionRecipeCapabilityMatrix().map(({ recipeId }) => recipeId),
    [
      "recipe.semantic-motion.log-quotient-fusion.v1",
      "recipe.semantic-motion.distribution-fan-out.v1",
      "recipe.semantic-motion.inverse-cancellation.v1",
      "recipe.semantic-motion.log-product-fission.v1"
    ]
  );
});

test("unknown operation incomplete family shape and unreviewed teaching intent fail closed", () => {
  const unknown = createSequentialSemanticMotionFixture(1).steps[0]!.precedence;
  const unknownResult = resolveKpSemanticMotionRecipe(unknown);
  assert.equal(unknownResult.status, "explicit-static");
  if (unknownResult.status === "explicit-static") {
    assert.equal(unknownResult.reason, "unsupported-operation");
  }

  const fixture = createQuotientSemanticMotionFixture();
  const contract = quotientSemanticMotionStructureContract();
  const malformedContract: KpSemanticMotionOperationStructureContract = {
    ...contract,
    cohorts: contract.cohorts.map((cohort, index) => index === 0
      ? { ...cohort, cohesion: { scope: "family-local", variantId: "unreviewed-fusion" } }
      : cohort)
  };
  const mismatch = resolveKpSemanticMotionRecipe(
    compileSemanticMotionPrecedenceFixture(fixture, malformedContract, quotientSemanticMotionPrecedenceSpec())
  );
  assert.equal(mismatch.status, "repair-required");
  if (mismatch.status === "repair-required") {
    assert.equal(mismatch.issues.some(({ code }) => code === "semantic-motion.recipe.cohesion-mismatch"), true);
  }

  const noticeFixture = createQuotientSemanticMotionFixture("notice");
  const review = resolveKpSemanticMotionRecipe(
    compileSemanticMotionPrecedenceFixture(noticeFixture, quotientSemanticMotionStructureContract(), quotientSemanticMotionPrecedenceSpec())
  );
  assert.equal(review.status, "human-review");
  if (review.status === "human-review") assert.equal(review.reason, "unreviewed-recipe");
});

test("structural copies cannot claim resolved recipe authority", () => {
  const fixture = createCancellationSemanticMotionFixture();
  const result = resolveKpSemanticMotionRecipe(
    compileSemanticMotionPrecedenceFixture(fixture, cancellationSemanticMotionStructureContract(), cancellationSemanticMotionPrecedenceSpec())
  );
  assert.equal(result.status, "resolved");
  if (result.status !== "resolved") return;
  assert.equal(isKpResolvedSemanticMotionRecipe({ ...result.resolution }), false);
});
