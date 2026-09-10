import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { checkKpComposedAlgebraPrefixV2, assertKpCheckedComposedAlgebraPrefixV2 } from "../src/authoring/composed-algebra-prefix-v2.ts";
import { assertKpSourceBoundComposedAlgebraProof } from "../src/authoring/composed-algebra-proof.ts";
import { isKpVerifiedComposedFactoring } from "../src/semantic/composed-algebra-factoring.ts";
import { isKpVerifiedComposedEvaluation } from "../src/semantic/composed-algebra-evaluation.ts";
import { KpComposedAlgebraRepair } from "../src/authoring/composed-algebra-source.ts";

const source = () => JSON.parse(readFileSync(new URL("../src/authoring/examples/composed-algebra-intuition.json", import.meta.url), "utf8"));

test("extended prefix reuses authenticated owners and exact shared endpoint", () => {
  const checked = checkKpComposedAlgebraPrefixV2(source());
  assertKpCheckedComposedAlgebraPrefixV2(checked);
  assertKpSourceBoundComposedAlgebraProof(checked.prefix);
  const [factoring, evaluation] = checked.prefix.chain.steps;
  assert.ok(isKpVerifiedComposedFactoring(factoring));
  assert.ok(isKpVerifiedComposedEvaluation(evaluation));
  assert.equal(evaluation.factoring, factoring);
  assert.equal(evaluation.source, factoring.target);
  assert.equal(evaluation.result.value, 5);
  assert.equal(checked.source.states.length, 5);
  assert.equal(checked.prefix.source.states.length, 3);
  assert.throws(() => assertKpSourceBoundComposedAlgebraProof(checked), TypeError);
  assert.throws(() => assertKpCheckedComposedAlgebraPrefixV2({ ...checked }), TypeError);
  assert.equal(checkKpComposedAlgebraPrefixV2(source()).revisionId, checked.revisionId);
  const changed = source(); changed.states[4].narration += " Changed.";
  assert.notEqual(checkKpComposedAlgebraPrefixV2(changed).revisionId, checked.revisionId);
});

test("extended prefix cannot conceal invalid factoring or a changed evaluation context", () => {
  for (const [index, latex] of [[1, "(2+4)(x+3)"], [2, "6(x+3)"], [2, "5(x+4)"]] as const) {
    const candidate = source(); candidate.states[index].latex = latex;
    assert.throws(() => checkKpComposedAlgebraPrefixV2(candidate), error => error instanceof KpComposedAlgebraRepair && error.path === `$.states[${index}].latex`);
  }
  const unfinished = source(); unfinished.states[4].latex = "999";
  // Prefix evidence deliberately makes no claim about the remaining deductions.
  assert.equal(checkKpComposedAlgebraPrefixV2(unfinished).prefix.chain.steps.length, 2);
});
