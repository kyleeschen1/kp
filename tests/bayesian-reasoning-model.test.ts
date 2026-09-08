import assert from "node:assert/strict";
import test from "node:test";
import { BinaryJointModel, createFlaggedTicketSource, parseBinaryJointSource, ProbabilityRepairGap } from "../domains/probability/binary-joint-model.ts";

test("binary model compiles two input forms to identical immutable joint truth", () => {
  const input = createFlaggedTicketSource(), model = BinaryJointModel.from(input);
  const rates = BinaryJointModel.from({ kind: "prior-likelihoods", sourceId: input.sourceId,
    events: input.events, prior: "1/5", likelihoods: ["4/5", "1/10"] });
  assert.deepEqual(rates.outcomes, model.outcomes);
  input.events[0]!.label = "Changed";
  input.masses[0] = "0/1";
  assert.equal(model.events[0].label, "Urgent");
  assert.deepEqual(model.outcomes[0].mass, { numerator: 4n, denominator: 25n });
  assert.ok(Object.isFrozen(model) && Object.isFrozen(model.outcomes) && Object.isFrozen(model.events[0]));
  assert.throws(() => BinaryJointModel.require({ ...model } as BinaryJointModel), ProbabilityRepairGap);
});

test("joint parser rejects malformed totals and source authority rather than repairing silently", () => {
  for (const masses of [["1/4", "1/4", "1/4", "0/1"], ["-1/2", "1/2", "1/2", "1/2"],
    ["1/0", "0/1", "0/1", "0/1"], ["2/1", "0/1", "0/1", "0/1"], [0.16, "4/100", "8/100", "72/100"],
    ["9".repeat(19) + "/1", "0/1", "0/1", "0/1"]]) {
    assert.throws(() => BinaryJointModel.from({ ...createFlaggedTicketSource(), masses }), ProbabilityRepairGap);
  }
  const source = createFlaggedTicketSource();
  assert.throws(() => BinaryJointModel.from({ ...source, independent: true }), ProbabilityRepairGap);
  assert.throws(() => BinaryJointModel.from({ ...source, events: [source.events[0], source.events[0]] }), ProbabilityRepairGap);
  assert.throws(() => parseBinaryJointSource("{"), ProbabilityRepairGap);
  assert.throws(() => parseBinaryJointSource(" ".repeat(100001)), ProbabilityRepairGap);
});

test("valid zero outcomes remain representable without invented conditional branches", () => {
  const model = BinaryJointModel.from({ ...createFlaggedTicketSource(), masses: ["0/1", "0/1", "0/1", "1/1"] });
  assert.equal(model.outcomes[0].mass.numerator, 0n);
  assert.deepEqual(model.outcomes.map(o => o.key), ["tt", "tf", "ft", "ff"]);
  assert.equal(new Set(model.outcomes.map(o => o.id)).size, 4);
});

// A serialized shape cannot satisfy the private validated model identity.
function typeBoundary(model: BinaryJointModel) {
  // @ts-expect-error external objects must go through the validating constructor
  const forged: BinaryJointModel = { sourceId: model.sourceId, events: model.events, outcomes: model.outcomes };
  return forged;
}
void typeBoundary;
