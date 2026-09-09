import assert from "node:assert/strict";
import test from "node:test";
import { readKpCommonFactorSource } from "../src/authoring/common-factor-source.ts";
import { normalizeKpCommonFactorEndpoints } from "../src/authoring/common-factor-normalizer.ts";
import { verifyKpCommonFactorRewrite, isKpVerifiedCommonFactorRewrite, KpCommonFactorVerificationError } from "../src/semantic/common-factor-rewrite.ts";

export function proofInput(before = "ab+ac", after = "a(b+c)") {
  const source = readKpCommonFactorSource({ schemaVersion: "kp.common-factor-source.v1", id: "lesson.proof.test", domain: "real-scalars", symbols: ["a", "b", "c", "d", "x", "y"],
    states: [{ id: "state.before", latex: before, narration: "Before" }, { id: "state.after", latex: after, narration: "After" }],
    editorial: { title: "Factor", setup: "Inspect", summary: "Group" } });
  const endpoints = normalizeKpCommonFactorEndpoints(source);
  return { domain: source.domain, symbols: source.symbols, source: endpoints[0].structured, target: endpoints[1].structured };
}

test("inverse distributive proof issues immutable occurrence-pinned authority including zero", () => {
  for (const [before, after] of [["ab+ac", "a(b+c)"], ["2x+2y", "2(x+y)"], ["0b+0c", "0(b+c)"], ["aa+aa", "a(a+a)"]]) {
    const input = proofInput(before, after), proof = verifyKpCommonFactorRewrite(input);
    assert.ok(isKpVerifiedCommonFactorRewrite(proof));
    assert.equal(proof.inverseDistribution.lawId, "kp.algebra.distribute.v1");
    assert.equal(proof.factorCopyIds.length, 2);
    assert.ok(Object.isFrozen(proof.target.root));
    assert.equal(verifyKpCommonFactorRewrite(input).revisionId, proof.revisionId);
    assert.equal(isKpVerifiedCommonFactorRewrite({ ...proof }), false);
    assert.equal(isKpVerifiedCommonFactorRewrite(JSON.parse(JSON.stringify(proof))), false);
  }
});

test("wrong factors, changed or reordered addends cannot acquire factoring proof", () => {
  for (const [before, after] of [["ab+ac", "a(b+d)"], ["2x+2y", "3(x+y)"], ["ab+ac", "a(c+b)"]])
    assert.throws(() => verifyKpCommonFactorRewrite(proofInput(before, after)),
      (e: unknown) => e instanceof KpCommonFactorVerificationError && e.code === "invalid-factorization");
  assert.throws(() => verifyKpCommonFactorRewrite(proofInput("a+b", "a(b+c)")), KpCommonFactorVerificationError);
});
