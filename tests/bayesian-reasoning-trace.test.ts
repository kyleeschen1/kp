import assert from "node:assert/strict";
import test from "node:test";
import { BinaryJointModel, createFlaggedTicketSource, ProbabilityRepairGap } from "../domains/probability/binary-joint-model.ts";
import { compileBinaryProbabilityTrace, factorBinaryTree, requireBinaryProbabilityTrace, treeJointMass, type BinaryProbabilityTrace } from "../domains/probability/binary-probability-trace.ts";
import { equalKpRationals } from "../domains/math/exact-rational.ts";

test("both tree orders preserve exact joint masses, even at unreachable parents", () => {
  for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4 - a; b++) for (let c = 0; c <= 4 - a - b; c++) {
    const model = BinaryJointModel.from({ ...createFlaggedTicketSource(), masses: [a, b, c, 4-a-b-c].map(n => `${n}/4`) });
    const forward = factorBinaryTree(model, 0), reversed = factorBinaryTree(model, 1);
    for (const outcome of model.outcomes) {
      assert.ok(equalKpRationals(treeJointMass(forward, outcome.id), outcome.mass));
      assert.ok(equalKpRationals(treeJointMass(reversed, outcome.id), outcome.mass));
    }
    for (const tree of [forward, reversed]) for (const branch of tree.branches) {
      if (branch.status === "unreachable") assert.equal("leaves" in branch, false);
      else for (const leaf of branch.leaves) assert.ok(model.outcomes.includes(leaf.outcome));
    }
  }
});

test("trace distinguishes marginalization, conditioning, restoration and representation reorder", () => {
  const model = BinaryJointModel.from(createFlaggedTicketSource()), trace = compileBinaryProbabilityTrace(model);
  assert.equal(trace.states.length, 7);
  assert.deepEqual(trace.operations.map(op => op.kind), ["construct", "construct", "collapse", "condition", "restore-population", "reorder"]);
  trace.operations.forEach((op, index) => {
    assert.equal(op.source, trace.states[index]);
    assert.equal(op.target, trace.states[index + 1]);
    assert.deepEqual(op.jointOutcomeIds, model.outcomes.map(o => o.id));
  });
  assert.equal(trace.operations[2]!.changesReferencePopulation, false);
  assert.equal(trace.operations[3]!.changesReferencePopulation, true);
  assert.equal(trace.operations[5]!.changesReferencePopulation, false);
  assert.equal(trace.states[5]!.kind, "tree");
  requireBinaryProbabilityTrace(trace);
  assert.throws(() => requireBinaryProbabilityTrace({ ...trace } as BinaryProbabilityTrace), ProbabilityRepairGap);
});

test("undefined lesson condition is an explicit gap, not an invented final answer", () => {
  const model = BinaryJointModel.from({ ...createFlaggedTicketSource(), masses: ["0/1", "1/2", "0/1", "1/2"] });
  assert.throws(() => compileBinaryProbabilityTrace(model), (error: unknown) =>
    error instanceof ProbabilityRepairGap && error.diagnostic.code === "probability.undefined-condition");
});
