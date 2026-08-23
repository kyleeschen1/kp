import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCommonDenominatorPressureAnimationAsset
} from "../src/animation/common-denominator-pressure-exemplar.ts";
import {
  createKpCompoundRootCarrierAnimationAsset
} from "../src/animation/compound-root-carrier-adapter.ts";
import {
  createKpEvenRootSolveAnimationAsset
} from "../src/animation/even-root-solve-adapter.ts";
import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createFractionSimplificationAnimationAsset
} from "../src/animation/fraction-adapter.ts";
import {
  createKpFractionEquivalenceExemplarAsset
} from "../src/animation/fraction-equivalence-exemplar.ts";
import {
  requireKpGenericEquationMigrationV2
} from "../src/domain-ir/equation-generic-v2-migration-dispatch.ts";
import {
  compileKpFractionRootMigrationV2
} from "../src/domain-ir/fraction-root-migration-v2.ts";

test("fraction and root callers compile with exact semantic operation authority", () => {
  const migrations = [
    [
      createKpFractionEquivalenceExemplarAsset("explain-unit-factor"),
      ["kp.algebra.scale-fraction-equivalently"]
    ],
    [
      createKpFractionEquivalenceExemplarAsset("compact-paired-operation"),
      ["kp.algebra.scale-fraction-equivalently"]
    ],
    [
      createKpCommonDenominatorPressureAnimationAsset(),
      [
        "kp.algebra.introduce-unit-factor",
        "kp.algebra.align-common-denominator",
        "kp.arithmetic.multiply"
      ]
    ],
    [
      createFractionSimplificationAnimationAsset(),
      [
        "kp.algebra.split-fraction-factors",
        "kp.algebra.merge-fraction-common-factor",
        "kp.algebra.simplify-unit-fraction-factor"
      ]
    ],
    [
      createExponentRadicalRewriteAnimationAsset(),
      ["kp.algebra.rewrite-power-as-root"]
    ],
    [
      createKpEvenRootSolveAnimationAsset(),
      [
        "operation.equation.apply-inverse-power.v1",
        "operation.arithmetic.evaluate-real-root.v1"
      ]
    ],
    [
      createKpCompoundRootCarrierAnimationAsset(),
      ["operation.root.compound-carrier-normalization"]
    ]
  ] as const;

  migrations.forEach(([animation, expected]) => {
    const migration = compileKpFractionRootMigrationV2(animation);
    assert.deepEqual(migration.operationIds, expected, animation.id);
    assert.equal(
      migration.presentationPlan.transitions.length,
      animation.transformations.length,
      animation.id
    );
  });
});

test("fraction and root evaluations resolve mandatory presentation authority", () => {
  const migrations = [
    compileKpFractionRootMigrationV2(
      createKpCommonDenominatorPressureAnimationAsset()
    ),
    compileKpFractionRootMigrationV2(
      createFractionSimplificationAnimationAsset()
    ),
    compileKpFractionRootMigrationV2(createKpEvenRootSolveAnimationAsset())
  ];
  const authorities = migrations.flatMap(({ presentationPlan }) =>
    presentationPlan.transitions.flatMap(
      ({ semanticOperation, evaluationAuthority }) =>
        evaluationAuthority === undefined ? [] : [{
          operationId: semanticOperation.operationId,
          kind: evaluationAuthority.presentationAuthority.kind
        }]
    )
  );

  assert.deepEqual(authorities, [{
    operationId: "kp.arithmetic.multiply",
    kind: "registered-operation-evaluation"
  }, {
    operationId: "kp.algebra.simplify-unit-fraction-factor",
    kind: "registered-cancellation"
  }, {
    operationId: "operation.arithmetic.evaluate-real-root.v1",
    kind: "registered-operation-evaluation"
  }]);
});

test("fraction migration preserves complete fan-out and contributor coverage", () => {
  const equivalence = compileKpFractionRootMigrationV2(
    createKpFractionEquivalenceExemplarAsset("explain-unit-factor")
  );
  const fraction = compileKpFractionRootMigrationV2(
    createFractionSimplificationAnimationAsset()
  );
  const commonDenominator = compileKpFractionRootMigrationV2(
    createKpCommonDenominatorPressureAnimationAsset()
  );

  assert.equal(equivalence.grammar.transitions[0]!
    .operation.roleBindings["scale-factor-copies"]?.length, 2);
  assert.equal(fraction.grammar.transitions[0]!
    .operation.roleBindings["factors-after"]?.length, 4);
  assert.ok(commonDenominator.grammar.transitions[2]!
    .operation.roleBindings["operands-before"]!.length > 1);
  assert.equal(commonDenominator.grammar.transitions[2]!
    .operation.roleBindings["result-after"]?.length, 1);
});

test("generic equation dispatch consumes generated fraction and radical callers", () => {
  const animations = [
    createFractionSimplificationAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset()
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
