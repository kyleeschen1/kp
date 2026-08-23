import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalCancellationPressureAnimationAsset
} from "../src/animation/cancellation-pressure-animation.ts";
import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "../src/animation/distribution-adapter.ts";
import { createLinearSolveAnimationAsset } from
  "../src/animation/linear-solve-adapter.ts";
import { createKpVerifiedGeneratedLinearSolveRuntimeAsset } from
  "../src/animation/verified-generated-linear-solve-runtime-asset.ts";
import {
  requireKpGenericEquationMigrationV2
} from "../src/domain-ir/equation-generic-v2-migration-dispatch.ts";
import {
  compileKpLinearOperationMigrationV2
} from "../src/domain-ir/linear-operation-migration-v2.ts";

const expectedOperations = Object.freeze({
  cancellation: ["kp.algebra.cancel-additive-inverses"],
  distribution: ["kp.algebra.distribute-multiplication"],
  factoring: ["kp.algebra.factor-common-term"],
  solveX: [
    "kp.algebra.subtract-both-sides",
    "kp.algebra.cancel-additive-inverses",
    "kp.algebra.simplify-constant-difference"
  ],
  generatedSolve: [
    "kp.algebra.subtract-both-sides",
    "kp.algebra.cancel-additive-inverses",
    "kp.algebra.simplify-constant-difference",
    "kp.algebra.divide-both-sides",
    "kp.algebra.cancel-multiplicative-inverses"
  ]
});

test("linear operation protocols compile five existing callers with exact authority", () => {
  const migrations = [
    [
      createKpCanonicalCancellationPressureAnimationAsset(),
      expectedOperations.cancellation
    ],
    [
      createDistributionExpansionAnimationAsset(),
      expectedOperations.distribution
    ],
    [
      createDistributionFactoringAnimationAsset(),
      expectedOperations.factoring
    ],
    [createLinearSolveAnimationAsset(), expectedOperations.solveX],
    [
      createKpVerifiedGeneratedLinearSolveRuntimeAsset(),
      expectedOperations.generatedSolve
    ]
  ] as const;

  migrations.forEach(([animation, expected]) => {
    const migration = compileKpLinearOperationMigrationV2(animation);
    assert.deepEqual(migration.operationIds, expected, animation.id);
    assert.equal(
      migration.presentationPlan.transitions.length,
      animation.transformations.length,
      animation.id
    );
  });
});

test("cancellation and arithmetic steps resolve mandatory evaluation authority", () => {
  const generated = compileKpLinearOperationMigrationV2(
    createKpVerifiedGeneratedLinearSolveRuntimeAsset()
  );
  const authorities = generated.presentationPlan.transitions
    .map(({ semanticOperation, evaluationAuthority }) => ({
      operationId: semanticOperation.operationId,
      kind: evaluationAuthority?.presentationAuthority.kind
    }))
    .filter(({ kind }) => kind !== undefined);

  assert.deepEqual(authorities, [{
    operationId: "kp.algebra.cancel-additive-inverses",
    kind: "registered-cancellation"
  }, {
    operationId: "kp.algebra.simplify-constant-difference",
    kind: "registered-operation-evaluation"
  }, {
    operationId: "kp.algebra.cancel-multiplicative-inverses",
    kind: "registered-cancellation"
  }]);
});

test("whole-equation roles enter semantic state without changing selector-only callers", () => {
  const animation = createLinearSolveAnimationAsset();
  const migration = compileKpLinearOperationMigrationV2(animation);
  const first = migration.grammar.transitions[0]!;
  const source = migration.grammar.states.find(
    ({ id }) => id === first.sourceStateId
  )!;
  const target = migration.grammar.states.find(
    ({ id }) => id === first.targetStateId
  )!;

  assert.ok(source.entityIds.includes("equation.linear-solve.initial"));
  assert.ok(target.entityIds.includes("equation.linear-solve.after-subtract"));
  assert.deepEqual(first.operation.roleBindings["operation-value"], []);
});

test("the generic equation surface dispatch consumes every migrated caller", () => {
  const animations = [
    createKpCanonicalCancellationPressureAnimationAsset(),
    createDistributionExpansionAnimationAsset(),
    createDistributionFactoringAnimationAsset(),
    createLinearSolveAnimationAsset(),
    createKpVerifiedGeneratedLinearSolveRuntimeAsset()
  ];
  animations.forEach((animation) => {
    const migration = requireKpGenericEquationMigrationV2(animation);
    assert.equal(migration?.assetId, animation.id);
    assert.equal(
      migration?.presentationPlan.transitions.length,
      animation.transformations.length
    );
  });
});
