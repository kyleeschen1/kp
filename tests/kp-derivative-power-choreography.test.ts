import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpDerivativePowerChoreography,
  createKpDerivativePowerRuleChoreography,
  kpDerivativePowerPhaseIds,
  sampleKpDerivativePowerChoreography
} from "../src/animation/derivative-power-choreography.ts";
import { createGeneratedProblemAnimationAsset } from "../src/animation/generated-problem-import.ts";
import {
  createKpDerivativePowerRuleCorrespondenceMap,
  createKpDerivativePowerRuleSemanticRoles
} from "../src/semantic/derivative-power-rule-semantics.ts";
import {
  createGeneratedCalculusProblemFixture
} from "../src/semantic/generated-calculus-problem-fixture.ts";

function fixture() {
  const semanticRoles = createKpDerivativePowerRuleSemanticRoles({
    sourceObjectId: "expression.source",
    targetObjectId: "expression.target",
    differentiationVariable: "x",
    base: "x",
    exponent: 3
  });
  const correspondenceMap = createKpDerivativePowerRuleCorrespondenceMap(
    semanticRoles,
    "transform.derivative"
  );
  const plan = compileKpDerivativePowerChoreography({
    id: "choreography.derivative",
    semanticRoles,
    correspondenceMap
  });
  return { semanticRoles, correspondenceMap, plan };
}

test("derivative power choreography compiles semantic branch roles", () => {
  const { plan } = fixture();

  assert.deepEqual(plan.phaseIds, kpDerivativePowerPhaseIds);
  assert.deepEqual(plan.operatorSelectorIds, [
    "expression.source.operator",
    "expression.source.operator-variable"
  ]);
  assert.deepEqual(plan.base, {
    sourceSelectorId: "expression.source.base",
    targetSelectorId: "expression.target.base"
  });
  assert.deepEqual(plan.exponent, {
    sourceSelectorId: "expression.source.exponent",
    coefficientSelectorId: "expression.target.coefficient",
    successorSelectorId: "expression.target.exponent",
    sourceMinimumScale: 0.7,
    coefficientPathVariant: "arc-below",
    successorPathVariant: "arc-above"
  });
});

test("derivative power animation exposes its envelope and semantic inspector plan", () => {
  const animation = createGeneratedProblemAnimationAsset(
    createGeneratedCalculusProblemFixture(
      "generated.calculus.derivative.power-rule-x-cubed"
    )
  );
  const choreography = createKpDerivativePowerRuleChoreography(animation);

  assert.deepEqual(
    choreography.plan.phases.map((phase) => phase.id),
    ["orient", "reflow", "act", "settle", "release"]
  );
  assert.equal(
    choreography.plan.semantic.canonicalOperationId,
    "kp.calculus.derivative.power-rule"
  );
  assert.deepEqual(choreography.plan.semantic.motifIds, ["derivative-power"]);
  assert.equal(choreography.plan.semantic.salience.branchGroups.length, 1);
  assert.deepEqual(
    choreography.plan.semantic.traversal.ranks.map((rank) => rank.rank),
    [0, 1, 2]
  );
});

test("derivative power choreography previews, acts, settles, and releases", () => {
  const { plan } = fixture();
  const preview = sampleKpDerivativePowerChoreography({ plan, progress: 0.16 });
  const act = sampleKpDerivativePowerChoreography({ plan, progress: 0.56 });
  const settle = sampleKpDerivativePowerChoreography({ plan, progress: 0.82 });
  const end = sampleKpDerivativePowerChoreography({ plan, progress: 1 });

  assert.ok(preview.focus.exponentEmphasis > 0);
  assert.equal(preview.coefficient.opacity, 0);
  assert.ok(act.base.reflowProgress > 0.99);
  assert.ok(act.exponentSource.scale >= 0.7);
  assert.ok(act.exponentSource.opacity > 0);
  assert.ok(act.coefficient.pathProgress > 0);
  assert.ok(act.successorExponent.decrementProgress > 0);
  assert.ok(settle.settlementProgress > 0);
  assert.ok(settle.exponentSource.opacity > 0);
  assert.deepEqual(end.focus, {
    exponentEmphasis: 0,
    shadowOpacity: 0
  });
  assert.equal(end.operator.opacity, 0);
  assert.equal(end.base.targetOpacity, 1);
  assert.equal(end.exponentSource.opacity, 0);
  assert.equal(end.coefficient.opacity, 1);
  assert.equal(end.successorExponent.opacity, 1);
});

test("derivative power choreography samples exact rewind symmetry", () => {
  const { plan } = fixture();
  for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
    const forward = sampleKpDerivativePowerChoreography({ plan, progress });
    const rewind = sampleKpDerivativePowerChoreography({
      plan,
      progress: 1 - progress,
      direction: "rewind"
    });
    assert.deepEqual(
      { ...rewind, direction: "forward", progress },
      forward
    );
  }
});

test("derivative power choreography rejects incomplete lineage", () => {
  const { semanticRoles, correspondenceMap } = fixture();
  assert.throws(() => compileKpDerivativePowerChoreography({
    id: "choreography.derivative",
    semanticRoles,
    correspondenceMap: {
      ...correspondenceMap,
      records: correspondenceMap.records.filter(
        (record) => record.id !== "exponent-branches"
      )
    }
  }), /requires operator removal, base persistence, and exponent fan-out/);
});
