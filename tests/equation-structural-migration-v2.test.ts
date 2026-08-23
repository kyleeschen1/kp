import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExponentialHomomorphismAnimationAsset
} from "../src/animation/exponential-homomorphism-adapter.ts";
import {
  createKpExponentialQuotientPressureAnimationAsset
} from "../src/animation/exponential-quotient-pressure-adapter.ts";
import {
  createExponentExpansionAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createFunctionWrapAnimationAsset
} from "../src/animation/function-wrap-adapter.ts";
import {
  createKpLogExponentAnimationAsset
} from "../src/animation/log-exponent-adapter.ts";
import {
  createKpLogProductAnimationAsset
} from "../src/animation/log-product-adapter.ts";
import {
  createKpLogQuotientAnimationAsset
} from "../src/animation/log-quotient-adapter.ts";
import {
  createKpLogarithmChangeOfBaseExemplarAsset
} from "../src/animation/logarithm-change-of-base-exemplar.ts";
import {
  compileKpExponentialHomomorphismMigrationV2
} from "../src/domain-ir/exponential-homomorphism-migration-v2.ts";
import {
  compileKpFunctionWrapMigrationV2
} from "../src/domain-ir/function-wrap-migration-v2.ts";
import {
  compileKpGeneratedExponentMigrationV2
} from "../src/domain-ir/generated-exponent-migration-v2.ts";
import {
  compileKpLogExponentMigrationV2
} from "../src/domain-ir/log-exponent-migration-v2.ts";
import {
  compileKpLogProductMigrationV2
} from "../src/domain-ir/log-product-migration-v2.ts";
import {
  compileKpLogQuotientMigrationV2
} from "../src/domain-ir/log-quotient-migration-v2.ts";
import {
  compileKpLogarithmChangeOfBaseMigrationV2
} from "../src/domain-ir/logarithm-change-of-base-migration-v2.ts";
import {
  kpEquationGovernanceV2MigrationDeclarations
} from "../src/domain-ir/equation-governance-v2-migrations.ts";
import {
  kpCanonicalExponentialHomomorphismAuthority
} from "../src/semantic/exponential-homomorphism-exemplar.ts";
import {
  kpExponentialQuotientPressureAuthority
} from "../src/semantic/exponential-quotient-pressure.ts";
import {
  kpLogProductSemanticMotionBundles
} from "../src/semantic/log-product-semantic-motion.ts";

test("log exponent, generated exponent, and function wrap compile every authored step", () => {
  const migrations = [
    compileKpLogExponentMigrationV2(createKpLogExponentAnimationAsset()),
    compileKpGeneratedExponentMigrationV2(
      createExponentExpansionAnimationAsset()
    ),
    compileKpFunctionWrapMigrationV2(createFunctionWrapAnimationAsset())
  ];
  assert.deepEqual(
    migrations.map(({ presentationPlan }) =>
      presentationPlan.transitions.length),
    [3, 2, 1]
  );
  assert.deepEqual(migrations.flatMap(({ operationIds }) => operationIds), [
    "kp.algebra.apply-natural-log-both-sides",
    "kp.algebra.extract-log-power-exponent",
    "kp.algebra.divide-both-sides-by-log-base",
    "kp.algebra.lower-exponent",
    "kp.algebra.unwrap-unit-exponent",
    "kp.algebra.wrap-function"
  ]);
});

test("homomorphic log and exponent families retain exact semantic operation authority", () => {
  const binaryLog = createKpLogProductAnimationAsset(
    kpLogProductSemanticMotionBundles[0]!.operation
  );
  const ternaryLog = createKpLogProductAnimationAsset(
    kpLogProductSemanticMotionBundles[1]!.operation
  );
  const migrations = [
    compileKpLogProductMigrationV2({
      animation: binaryLog,
      semanticMotion: kpLogProductSemanticMotionBundles[0]!
    }),
    compileKpLogProductMigrationV2({
      animation: ternaryLog,
      semanticMotion: kpLogProductSemanticMotionBundles[1]!
    }),
    compileKpLogQuotientMigrationV2(createKpLogQuotientAnimationAsset()),
    compileKpExponentialHomomorphismMigrationV2({
      animation: createKpExponentialHomomorphismAnimationAsset(),
      authority: kpCanonicalExponentialHomomorphismAuthority,
      operationId: "operation.equation.exponential-sum-to-product.v1"
    }),
    compileKpExponentialHomomorphismMigrationV2({
      animation: createKpExponentialQuotientPressureAnimationAsset(),
      authority: kpExponentialQuotientPressureAuthority,
      operationId:
        "operation.equation.exponential-difference-to-quotient.v1"
    })
  ];
  assert.deepEqual(migrations.flatMap(({ operationIds }) => operationIds), [
    "kp.semantic-motion.log-product",
    "kp.semantic-motion.log-product",
    "kp.semantic-motion.quotient",
    "operation.equation.exponential-sum-to-product.v1",
    "operation.equation.exponential-difference-to-quotient.v1"
  ]);
});

test("change of base compiles from verified semantic roles", () => {
  const migration = compileKpLogarithmChangeOfBaseMigrationV2(
    createKpLogarithmChangeOfBaseExemplarAsset()
  );
  assert.deepEqual(migration.operationIds, [
    "kp.algebra.change-logarithm-base"
  ]);
  assert.equal(migration.presentationPlan.transitions.length, 1);
});

test("the structural migration ledger names every compiled caller and existing equivalence plan", () => {
  const structural = kpEquationGovernanceV2MigrationDeclarations.filter(
    ({ compilerId }) => compilerId !==
      "kp.equation-evaluation-migration-compiler.v2"
  );
  assert.deepEqual(structural.map(({ assetId }) => assetId).sort(), [
    "animation.algebra.exponential-homomorphism.difference-to-quotient",
    "animation.algebra.exponential-homomorphism.sum-to-product",
    "animation.algebra.log-exponent.solve-two-power-x",
    "animation.algebra.log-product.equivalence-frame",
    "animation.algebra.log-product.product-to-sum",
    "animation.algebra.log-product.three-factors-to-sum",
    "animation.algebra.log-quotient.difference-to-quotient",
    "animation.algebra.radical.compound-carrier-normalization",
    "animation.algebra.radical.solve-x-squared-nine",
    "animation.comparison.jacobian-hessian",
    "animation.comparison.linear-solve-programming",
    "animation.equation.finite-product-expansion.v1",
    "animation.equation.finite-sum-expansion.v1",
    "animation.equation.fraction-equivalence.common-denominator-pressure.v1",
    "animation.equation.fraction-equivalence.compact.v1",
    "animation.equation.fraction-equivalence.v1",
    "animation.equation.logarithm-change-of-base.v1",
    "animation.generated.cancellation.additive-inverses",
    "animation.generated.distribution.expand-a-sum",
    "animation.generated.distribution.factor-common-a",
    "animation.generated.calculus.derivative.sum-rule-polynomial",
    "animation.generated.calculus.integral.power-rule-quadratic",
    "animation.generated.exponent.square-as-product",
    "animation.generated.fraction-expression.two-fourths",
    "animation.generated.function-wrap.apply-f",
    "animation.generated.linear-solve.linear-68c15d41",
    "animation.generated.linear-algebra.dot-product.three-vector",
    "animation.generated.linear-algebra.matrix-matrix.two-by-two",
    "animation.generated.linear-algebra.matrix-vector.two-by-two",
    "animation.generated.radical.square-root-as-power",
    "animation.generated.substitute-three",
    "animation.inequality.sign-flip.basic",
    "animation.linear-solve.solve-x",
    "animation.sample.fourier-transform-pair",
    "animation.sample.fundamental-theorem-calculus"
  ].sort());
});
