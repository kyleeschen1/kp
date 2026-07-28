import assert from "node:assert/strict";
import test from "node:test";

import { createKpLawfulFractionSolveMacro } from "../src/semantic/fraction-solve-macro.ts";

test("lawful fraction solve macro composes a continuous authority-backed trace", () => {
  const macro = createKpLawfulFractionSolveMacro();

  assert.equal(macro.states.length, 14);
  assert.equal(macro.steps.length, 13);
  assert.deepEqual(macro.states.map(({ verifiedSolution }) => verifiedSolution),
    Array.from({ length: 14 }, () => ({ numerator: "9", denominator: "1" })));
  assert.ok(macro.steps.every((step, index) =>
    step.sourceStateId === macro.states[index]!.id &&
    step.targetStateId === macro.states[index + 1]!.id &&
    step.authorityIds.length > 0
  ));
  assert.equal(macro.verification.schemaVersion, "kp.verified-fraction-solve-trace.v1");
  assert.equal(macro.verification.stateCount, 14);
  assert.equal(macro.verification.stepCount, 13);
  assert.deepEqual(
    macro.verification.stateIds,
    macro.states.map(({ id }) => id)
  );
  assert.deepEqual(
    macro.verification.stepIds,
    macro.steps.map(({ id }) => id)
  );
  assert.deepEqual(macro.verification.adjacency[0], {
    stepId: "fraction-solve.step.distribute",
    sourceStateId: "fraction-solve.state.factored",
    targetStateId: "fraction-solve.state.distributed",
    authorityIds: [
      "kp.algebra.distribute.v1",
      "fixture.fraction-fan-out.two-thirds-x-plus-six.distributed-sum"
    ]
  });
  assert.deepEqual(macro.verification.solution, { numerator: "9", denominator: "1" });
});

test("fraction macro reuses the verified fan-out normalization and inverse contracts", () => {
  const macro = createKpLawfulFractionSolveMacro();

  assert.equal(
    macro.states[0]!.left.root.id,
    macro.composition.normalization.fanOut.source.root.id
  );
  assert.equal(
    macro.states[1]!.left.root.id,
    macro.composition.normalization.fanOut.target.root.id
  );
  assert.equal(macro.states[2]!.left.root.id, macro.composition.expression.root.id);
  assert.deepEqual(macro.steps.slice(0, 2).map(({ authorityIds }) => authorityIds), [
    [
      "kp.algebra.distribute.v1",
      "fixture.fraction-fan-out.two-thirds-x-plus-six.distributed-sum"
    ],
    [
      "plan.fraction-fan-out.normalize-numerators",
      "composition.fraction-fan-out.normalized-sum"
    ]
  ]);
  assert.equal(macro.reverseFactoring.sourceRootId, macro.states[1]!.left.root.id);
  assert.equal(macro.reverseFactoring.targetRootId, macro.states[0]!.left.root.id);
  assert.equal(
    macro.verification.compositionProof,
    macro.composition.verification
  );
  assert.equal(
    macro.verification.reverseFactoringProof,
    macro.reverseFactoring
  );
});

test("fraction macro rejects a final state that changes the exact solution", () => {
  assert.throws(
    () => createKpLawfulFractionSolveMacro({ finalValue: 8 }),
    /state fraction-solve\.state\.solved changes the solution to 8\/1/
  );
});
