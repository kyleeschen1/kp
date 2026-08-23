import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpDerivativePowerMigrationV2
} from "../src/domain-ir/derivative-power-migration-v2.ts";
import {
  requireKpGenericEquationMigrationV2
} from "../src/domain-ir/equation-generic-v2-migration-dispatch.ts";

const animationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";

function animation() {
  return createKpAnimationAssets().find(({ id }) => id === animationId)!;
}

test("derivative power v2 preserves its two authored semantic beats", () => {
  const migration = compileKpDerivativePowerMigrationV2(animation());
  assert.deepEqual(migration.operationIds, [
    "kp.semantic-motion.derivative-power-rule",
    "kp.arithmetic.subtract"
  ]);
  assert.deepEqual(
    migration.grammar.transitions.map(({ operation }) => ({
      operationId: operation.operationId,
      semanticClass: operation.semanticClass
    })),
    [
      {
        operationId: "kp.semantic-motion.derivative-power-rule",
        semanticClass: "transformation"
      },
      {
        operationId: "kp.arithmetic.subtract",
        semanticClass: "evaluation"
      }
    ]
  );
  assert.equal(migration.presentationPlan.transitions.length, 2);
  assert.equal(
    migration.presentationPlan.transitions[1]?.evaluationAuthority?.authorityId,
    "kp.presentation.operation-evaluation.difference.authority-v2"
  );
});

test("derivative power v2 binds lineage and evaluation roles exactly", () => {
  const migration = compileKpDerivativePowerMigrationV2(animation());
  assert.deepEqual(
    migration.grammar.transitions[0]?.operation.roleBindings,
    {
      "base-before": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.base"
      ],
      "exponent-before": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.exponent"
      ],
      "derivative-artifacts": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.operator",
        "expression.generated.calculus.derivative.power-rule-x-cubed.initial.operator-variable"
      ],
      "base-after": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.applied.base"
      ],
      "coefficient-after": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.applied.coefficient"
      ],
      "exponent-after": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.applied.exponent"
      ]
    }
  );
  assert.deepEqual(
    migration.grammar.transitions[1]?.operation.roleBindings,
    {
      "operands-before": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.applied.exponent",
        "expression.generated.calculus.derivative.power-rule-x-cubed.applied.decrement-operator",
        "expression.generated.calculus.derivative.power-rule-x-cubed.applied.decrement-amount"
      ],
      "result-after": [
        "expression.generated.calculus.derivative.power-rule-x-cubed.derived.exponent"
      ]
    }
  );
});

test("the generic equation host consumes derivative power governance", () => {
  const migration = requireKpGenericEquationMigrationV2(animation());
  assert.equal(migration?.assetId, animationId);
  assert.equal(
    migration?.presentationPlan.id,
    `presentation.grammar.${animationId}.v2`
  );
});
