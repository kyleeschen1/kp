import assert from "node:assert/strict";
import test from "node:test";
import { normalizeKpScalarSumProductEndpoint } from "../src/authoring/common-factor-normalizer.ts";
import { verifyKpComposedFactoring } from "../src/semantic/composed-algebra-factoring.ts";
import { verifyKpComposedEvaluation, isKpVerifiedComposedEvaluation, KpComposedEvaluationError } from "../src/semantic/composed-algebra-evaluation.ts";
import type { KpDistributionOrientation } from "../src/semantic/structured-expression-rewrite.ts";
import { createKpConstantSumEvaluationAsset } from "../src/semantic/constant-sum-evaluation-asset.ts";

function endpoint(latex: string, id: string) {
  return normalizeKpScalarSumProductEndpoint({ id, latex }, ["x"], id).structured;
}
function factor(left = 2, right = 3, context = "(x+3)", orientation: KpDistributionOrientation = "right") {
  const source = orientation === "right" ? `${left}*${context}+${right}*${context}` : `${context}*${left}+${context}*${right}`;
  const target = orientation === "right" ? `(${left}+${right})*${context}` : `${context}*(${left}+${right})`;
  return verifyKpComposedFactoring({ domain: "real-scalars", symbols: ["x"], orientation,
    source: endpoint(source, "expanded"), target: endpoint(target, "factored") });
}

test("exact contextual evaluation keeps canonical successor roles and authenticated unchanged context", () => {
  for (const [left, right, context, orientation, result] of [
    [2, 3, "(x+3)", "right", "5(x+3)"], [2, 3, "(x+3)", "left", "(x+3)*5"],
    [0, 0, "(x+x)", "right", "0(x+x)"], [12, 34, "(x*3)", "right", "46(x*3)"],
    [9007199254740990, 1, "(x+3)", "right", "9007199254740991(x+3)"]
  ] as const) {
    const factoring = factor(left, right, context, orientation);
    const target = endpoint(result, "evaluated");
    const proof = verifyKpComposedEvaluation({ factoring, target });
    assert.ok(isKpVerifiedComposedEvaluation(proof));
    assert.equal(proof.source, factoring.target);
    assert.equal(proof.result.value, left + right);
    assert.equal(proof.revisionId, verifyKpComposedEvaluation({ factoring, target }).revisionId);
    assert.ok(Object.isFrozen(proof.preservedContext));
    const canonical = createKpConstantSumEvaluationAsset({ id: `composed-${proof.revisionId.slice(7)}`, left, right });
    assert.deepEqual(proof.localEvaluation, canonical);
    const assetValue = proof.localEvaluation.bundle.objects[0]!.value;
    assert.ok(assetValue !== null && typeof assetValue === "object");
    assert.throws(() => Object.assign(assetValue, { latex: "wrong" }), TypeError);
    assert.throws(() => Object.assign(proof.localEvaluation.transformation, { transformType: "unrelated" }), TypeError);
    assert.equal(isKpVerifiedComposedEvaluation({ ...proof }), false);
    assert.equal(isKpVerifiedComposedEvaluation(JSON.parse(JSON.stringify(proof))), false);
  }
});

test("contextual evaluation rejects wrong results, changed or commuted context, orientation and overflow", () => {
  const factoring = factor();
  for (const result of ["6(x+3)", "5(x+4)", "5(3+x)", "(x+3)*5", "5(x*x)", "5"]) {
    assert.throws(() => verifyKpComposedEvaluation({ factoring, target: endpoint(result, "evaluated") }), KpComposedEvaluationError, result);
  }
  assert.throws(() => verifyKpComposedEvaluation({ factoring: factor(Number.MAX_SAFE_INTEGER, 1), target: endpoint("5(x+3)", "evaluated") }),
    (e: unknown) => e instanceof KpComposedEvaluationError && e.code === "unsupported-shape");
  assert.throws(() => verifyKpComposedEvaluation({ factoring: { ...factoring }, target: endpoint("5(x+3)", "evaluated") }),
    (e: unknown) => e instanceof KpComposedEvaluationError && e.code === "missing-authority");
  assert.throws(() => verifyKpComposedEvaluation({ factoring, target: endpoint("5(x+3)", "factored") }), KpComposedEvaluationError);
});
