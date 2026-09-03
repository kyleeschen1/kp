import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import {
  findKpWaveBEquationStructuralDeclaration,
  kpWaveBEquationStructuralDeclarations,
  projectKpEquationSurfaceFamily
} from "../src/domain-ir/equation-surface-family-declarations.ts";
import {
  findKpEquationStructuralChoreographyDeclaration,
  kpEquationStructuralChoreographyDeclarations
} from "../src/animation/equation-structural-choreography-declarations.ts";

const expectedWaveBIds = Object.freeze([
  "animation.algebra.exponential-homomorphism.difference-to-quotient",
  "animation.algebra.exponential-homomorphism.sum-to-product",
  "animation.algebra.log-exponent.solve-two-power-x",
  "animation.algebra.log-quotient.difference-to-quotient",
  "animation.equation.logarithm-change-of-base.v1",
  "animation.generated.exponent.square-as-product",
  "animation.generated.fraction-expression.two-fourths",
  "animation.generated.function-wrap.apply-f",
  "animation.generated.linear-algebra.dot-product.three-vector",
  "animation.generated.linear-algebra.matrix-matrix.two-by-two",
  "animation.generated.linear-algebra.matrix-vector.two-by-two",
  "animation.generated.radical.square-root-as-power"
]);

test("wave B has one immutable structural recipe declaration per asset", () => {
  assert.equal(Object.isFrozen(kpWaveBEquationStructuralDeclarations), true);
  assert.deepEqual(
    kpWaveBEquationStructuralDeclarations
      .map(({ animationId }) => animationId)
      .sort(),
    [...expectedWaveBIds].sort()
  );

  for (const declaration of kpWaveBEquationStructuralDeclarations) {
    assert.equal(Object.isFrozen(declaration), true);
    assert.equal(Object.isFrozen(declaration.recipeIds), true);
    assert.equal(Object.isFrozen(declaration.recipeOwnerPaths), true);
    assert.equal(declaration.authority, "typed-structural-recipe");
    assert.ok(declaration.recipeIds.length > 0);
    assert.ok(declaration.recipeIds.every((id) =>
      /^recipe\.equation\.[a-z0-9-]+\.v[1-9][0-9]*$/.test(id)
    ));
    assert.ok(declaration.recipeOwnerPaths.every((path) => existsSync(path)));

    const projection = projectKpEquationSurfaceFamily(declaration.animationId);
    assert.equal(projection.migrationWave, "wave-b-structural-native-math");
    assert.deepEqual(projection.structuralRecipeIds, declaration.recipeIds);
  }
});

test("structural operations select choreography from one typed declaration table", () => {
  assert.equal(Object.isFrozen(kpEquationStructuralChoreographyDeclarations), true);
  assert.equal(
    new Set(kpEquationStructuralChoreographyDeclarations.map(
      ({ transformType }) => transformType
    )).size,
    kpEquationStructuralChoreographyDeclarations.length
  );
  assert.deepEqual(
    findKpEquationStructuralChoreographyDeclaration("splitFractionFactors"),
    {
      transformType: "splitFractionFactors",
      channel: "fraction-material",
      recipeId: "recipe.equation.fraction-material.v1",
      operationKind: "split-factors"
    }
  );
  assert.deepEqual(
    findKpEquationStructuralChoreographyDeclaration("lowerExponent"),
    {
      transformType: "lowerExponent",
      channel: "exponent-law",
      recipeId: "recipe.equation.exponent-expansion.v1",
      operationKind: "peel-one-factor"
    }
  );
  assert.deepEqual(
    findKpEquationStructuralChoreographyDeclaration("wrapFunction"),
    {
      transformType: "wrapFunction",
      channel: "function-wrap",
      recipeId: "recipe.equation.function-application.v1"
    }
  );
  assert.equal(
    findKpEquationStructuralChoreographyDeclaration("unknown-operation"),
    undefined
  );
});

test("asset-specific structural behavior is declared instead of branched", () => {
  assert.equal(
    findKpWaveBEquationStructuralDeclaration(
      "animation.generated.radical.square-root-as-power"
    )?.materialContinuityId,
    "material-continuity.radical-native-settlement.v1"
  );
  assert.equal(
    findKpWaveBEquationStructuralDeclaration(
      "animation.generated.exponent.square-as-product"
    )?.explanationProjectionId,
    "explanation-projection.exponent-fluent-unit-omission.v1"
  );
  assert.equal(
    findKpWaveBEquationStructuralDeclaration(
      "animation.generated.linear-algebra.matrix-vector.two-by-two"
    )?.structuralAugmentationId,
    "structural-augmentation.matrix-vector-rank6-linear-map.v1"
  );
});
