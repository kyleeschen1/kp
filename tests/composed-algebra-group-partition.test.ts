import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraPrefixV2 } from "../src/authoring/composed-algebra-prefix-v2.ts";
import { verifyKpComposedGroupPartition, isKpVerifiedComposedGroupPartition, assertKpComposedGroupPartitionForEvaluation,
  type KpVerifiedComposedGroupPartition } from "../src/semantic/composed-algebra-group-partition.ts";

function candidate() {
  const evaluation = checkKpComposedAlgebraPrefixV2(primary).prefix.chain.steps[1];
  const group = evaluation.preservedContext;
  if (group.kind !== "sum") throw Error("fixture");
  return { evaluation, groupId: group.id, memberIds: [group.terms[0]!.id, group.terms[1]!.id] as const };
}

test("whole/member partition retains issued occurrence identity without a rewrite", () => {
  const input = candidate(), partition = verifyKpComposedGroupPartition(input);
  assert.ok(isKpVerifiedComposedGroupPartition(partition));
  assert.equal(partition.evaluation, input.evaluation);
  assert.equal(partition.group, input.evaluation.preservedContext);
  assert.equal(partition.members[0], partition.group.terms[0]);
  assert.equal(partition.members[1], partition.group.terms[1]);
  assert.ok(Object.isFrozen(partition) && Object.isFrozen(partition.members));
  assert.equal(verifyKpComposedGroupPartition(input).revisionId, partition.revisionId);
  assertKpComposedGroupPartitionForEvaluation(partition, input.evaluation);
});

test("missing, overlapping, reordered, nested and foreign member coverage cannot gain authority", () => {
  const input = candidate();
  for (const memberIds of [[], [input.memberIds[0]], [...input.memberIds, "extra"],
    [input.memberIds[0], input.memberIds[0]], [...input.memberIds].reverse(),
    [input.groupId, input.memberIds[1]], ["foreign.x", input.memberIds[1]]]) {
    assert.throws(() => verifyKpComposedGroupPartition({ ...input,
      memberIds: memberIds as unknown as readonly [string, string] }), /both complete immediate members/);
  }
  assert.throws(() => verifyKpComposedGroupPartition({ ...input, groupId: "foreign.group" }), /both complete/);
  // @ts-expect-error A partial partition is not even a constructor candidate.
  const incomplete: Parameters<typeof verifyKpComposedGroupPartition>[0] = { ...input, memberIds: [input.memberIds[0]] };
  assert.equal(incomplete.memberIds.length, 1);
});

test("partition capabilities reject copied and foreign proofs, including equal revisions", () => {
  const input = candidate(), partition = verifyKpComposedGroupPartition(input);
  assert.equal(isKpVerifiedComposedGroupPartition({ ...partition }), false);
  assert.throws(() => verifyKpComposedGroupPartition({ ...input, evaluation: { ...input.evaluation } }), /issued coefficient/);
  assert.throws(() => assertKpComposedGroupPartitionForEvaluation({ ...partition }, input.evaluation), /issued group/);
  assert.throws(() => assertKpComposedGroupPartitionForEvaluation(partition, candidate().evaluation), /different evaluation/);
  // @ts-expect-error Serialized data cannot manufacture the private capability.
  const unissued: KpVerifiedComposedGroupPartition = { kind: partition.kind, evaluation: input.evaluation,
    revisionId: partition.revisionId, group: partition.group, members: partition.members };
  assert.equal(isKpVerifiedComposedGroupPartition(unissued), false);
});

test("a compound member stays intact and cannot be replaced by one of its descendants", () => {
  const source = structuredClone(primary);
  source.states[0]!.latex = "2(x+3*x)+3(x+3*x)";
  source.states[1]!.latex = "(2+3)(x+3*x)";
  source.states[2]!.latex = "5(x+3*x)";
  const evaluation = checkKpComposedAlgebraPrefixV2(source).prefix.chain.steps[1];
  const group = evaluation.preservedContext;
  if (group.kind !== "sum") throw Error("fixture");
  const compound = group.terms[1];
  if (compound?.kind !== "product") throw Error("fixture");
  const input = { evaluation, groupId: group.id, memberIds: [group.terms[0]!.id, group.terms[1]!.id] as const };
  assert.equal(verifyKpComposedGroupPartition(input).members[1], group.terms[1]);
  assert.throws(() => verifyKpComposedGroupPartition({ ...input,
    memberIds: [input.memberIds[0], compound.factors[0]!.id] }), /complete immediate members/);
});
