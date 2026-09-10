import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import { checkKpComposedAlgebraProof, bindKpComposedAlgebraProof, assertKpSourceBoundComposedAlgebraProof } from "../src/authoring/composed-algebra-proof.ts";
import { readKpComposedAlgebraSource, KpComposedAlgebraRepair } from "../src/authoring/composed-algebra-source.ts";
import { verifyKpComposedAlgebraChain, isKpVerifiedComposedAlgebraChain, KpComposedChainError } from "../src/semantic/composed-algebra-chain.ts";
import { verifyKpComposedEvaluation } from "../src/semantic/composed-algebra-evaluation.ts";
import { normalizeKpScalarSumProductEndpoint } from "../src/authoring/common-factor-normalizer.ts";

test("primary source authenticates exactly two adjacent deductions and three revision-pinned states", () => {
  const checked = checkKpComposedAlgebraProof(primary);
  assertKpSourceBoundComposedAlgebraProof(checked);
  assert.ok(isKpVerifiedComposedAlgebraChain(checked.chain));
  assert.equal(checked.chain.steps.length, 2); assert.equal(checked.chain.endpoints.length, 3);
  assert.equal(checked.chain.steps[0].orientation, "right");
  assert.equal(checked.chain.steps[1].source, checked.chain.steps[0].target);
  assert.equal(checked.chain.steps[1].result.value, 5);
  assert.equal(checkKpComposedAlgebraProof(primary).revisionId, checked.revisionId);
  assert.equal("presentation" in checked, false);
  for (const copy of [{ ...checked }, JSON.parse(JSON.stringify(checked))]) assert.throws(() => assertKpSourceBoundComposedAlgebraProof(copy), TypeError);
  assert.equal(isKpVerifiedComposedAlgebraChain({ ...checked.chain }), false);
  const editorial = checkKpComposedAlgebraProof({ ...primary, editorial: { ...primary.editorial, title: "A new reading" } });
  assert.equal(editorial.chain.revisionId, checked.chain.revisionId);
  assert.notEqual(editorial.revisionId, checked.revisionId);
});

test("individually valid but foreign, copied or reordered steps cannot compose", () => {
  const checked = checkKpComposedAlgebraProof(primary), other = checkKpComposedAlgebraProof(primary);
  const [factoring, evaluation] = checked.chain.steps;
  assert.throws(() => verifyKpComposedAlgebraChain({ factoring: other.chain.steps[0], evaluation }),
    (e: unknown) => e instanceof KpComposedChainError && e.code === "disconnected-chain");
  assert.throws(() => verifyKpComposedAlgebraChain({ factoring, evaluation: { ...evaluation } }), KpComposedChainError);
  assert.throws(() => bindKpComposedAlgebraProof({ source: checked.source, chain: { ...checked.chain } }), KpComposedAlgebraRepair);
  for (const states of [[primary.states[1], primary.states[0], primary.states[2]],
    primary.states.map((s, i) => ({ ...s, id: i === 1 ? "foreign.middle" : s.id })),
    primary.states.map((s, i) => ({ ...s, latex: i === 2 ? "6(x+3)" : s.latex }))]) {
    const source = readKpComposedAlgebraSource({ ...primary, states });
    assert.throws(() => bindKpComposedAlgebraProof({ source, chain: checked.chain }),
      (e: unknown) => e instanceof KpComposedAlgebraRepair && e.code === "disconnected-chain");
  }
  // Pairwise-disjoint proofs do not establish disjointness across the whole chain.
  const target = normalizeKpScalarSumProductEndpoint({ id: factoring.source.root.id, latex: "5(x+3)" }, ["x"], "target").structured;
  const overlapping = verifyKpComposedEvaluation({ factoring, target });
  assert.throws(() => verifyKpComposedAlgebraChain({ factoring, evaluation: overlapping }), KpComposedChainError);
});

test("source checker returns located mathematical repairs and uniquely proves left orientation", () => {
  for (const [index, latex, code] of [[1, "(2+4)(x+3)", "invalid-factorization"],
    [2, "6(x+3)", "invalid-evaluation"], [2, "5(x+4)", "invalid-evaluation"]] as const) {
    const value = { ...primary, states: primary.states.map((s, i) => ({ ...s, latex: i === index ? latex : s.latex })) };
    assert.throws(() => checkKpComposedAlgebraProof(value),
      (e: unknown) => e instanceof KpComposedAlgebraRepair && e.code === code && e.path === `$.states[${index}].latex`);
  }
  const left = checkKpComposedAlgebraProof({ ...primary, states: primary.states.map((s, i) => ({ ...s,
    latex: ["(x+3)*2+(x+3)*3", "(x+3)(2+3)", "(x+3)*5"][i] })) });
  assert.equal(left.chain.steps[0].orientation, "left");
});
