import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-intuition.json" with { type: "json" };
import { checkKpComposedAlgebraProofV2, bindKpComposedAlgebraProofV2, assertKpSourceBoundComposedAlgebraProofV2 } from "../src/authoring/composed-algebra-proof-v2.ts";
import { verifyKpComposedAlgebraChainV2, isKpVerifiedComposedAlgebraChainV2 } from "../src/semantic/composed-algebra-chain-v2.ts";
import { verifyKpComposedAlgebraChain } from "../src/semantic/composed-algebra-chain.ts";
import { readKpComposedAlgebraSourceV2 } from "../src/authoring/composed-algebra-source-v2.ts";

test("complete v2 chain has exactly three or four authenticated moves and source-bound endpoints", () => {
  const proof = checkKpComposedAlgebraProofV2(primary);
  assert.ok(isKpVerifiedComposedAlgebraChainV2(proof.chain));
  assert.equal(proof.chain.extent, "evaluated");
  assert.equal(proof.chain.steps.length, 4);
  assert.deepEqual(proof.chain.endpoints.map(e => e.root.id), primary.states.map(s => s.id));
  proof.chain.steps.forEach((step, index) => {
    assert.equal(step.source, proof.chain.endpoints[index]); assert.equal(step.target, proof.chain.endpoints[index + 1]);
  });
  const shorter = checkKpComposedAlgebraProofV2({ ...primary, states: primary.states.slice(0, 4) });
  assert.equal(shorter.chain.extent, "distributed");
  assert.equal(shorter.chain.steps.length, 3);
  assert.notEqual(shorter.revisionId, proof.revisionId);
});

test("equivalent foreign steps, forged chains and stale source revisions cannot be connected", () => {
  const checked = checkKpComposedAlgebraProofV2(primary), foreign = checkKpComposedAlgebraProofV2(primary);
  const chain = checked.chain;
  assert.equal(chain.extent, "evaluated");
  if (chain.extent !== "evaluated" || foreign.chain.extent !== "evaluated") throw new Error("Expected full chain.");
  const prefix = verifyKpComposedAlgebraChain({ factoring: chain.steps[0], evaluation: chain.steps[1] });
  const foreignProduct = foreign.chain.steps[3];
  assert.throws(() => verifyKpComposedAlgebraChainV2({ prefix, distribution: foreign.chain.steps[2] }), /exact preceding/);
  assert.throws(() => verifyKpComposedAlgebraChainV2({ prefix, distribution: chain.steps[2], product: foreignProduct }), /exact preceding/);
  assert.throws(() => verifyKpComposedAlgebraChainV2({ prefix, distribution: { ...chain.steps[2] } }), /issued/);
  assert.equal(isKpVerifiedComposedAlgebraChainV2({ ...chain }), false);
  assert.throws(() => bindKpComposedAlgebraProofV2({ source: checked.source, chain: { ...chain } }), /issued/);
  assert.throws(() => assertKpSourceBoundComposedAlgebraProofV2({ ...checked }), /issued/);
  const changed = structuredClone(primary); changed.states[4]!.latex = "5x+16";
  assert.throws(() => bindKpComposedAlgebraProofV2({ source: readKpComposedAlgebraSourceV2(changed), chain }), /match/);
  assert.throws(() => bindKpComposedAlgebraProofV2({ source: checked.source,
    chain: checkKpComposedAlgebraProofV2({ ...primary, states: primary.states.slice(0, 4) }).chain }), /count/);
  // @ts-expect-error The type retains the exact final operation, not a generic proof array.
  const reordered: typeof chain.steps = [chain.steps[0], chain.steps[1], chain.steps[3], chain.steps[2]];
  assert.ok(reordered);
});
