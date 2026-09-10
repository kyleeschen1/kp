import assert from "node:assert/strict";
import test from "node:test";
import { normalizeKpScalarSumProductEndpoint } from "../src/authoring/common-factor-normalizer.ts";
import { verifyKpComposedFactoring, isKpVerifiedComposedFactoring, KpComposedFactoringError } from "../src/semantic/composed-algebra-factoring.ts";
import type { KpDistributionOrientation } from "../src/semantic/structured-expression-rewrite.ts";
import type { KpStructuredExpressionNode } from "../src/semantic/structured-expression.ts";

function input(before = "2(x+3)+3(x+3)", after = "(2+3)(x+3)", orientation: KpDistributionOrientation = "right") {
  return { domain: "real-scalars" as const, symbols: ["x"], orientation,
    source: normalizeKpScalarSumProductEndpoint({ id: "before", latex: before }, ["x"], "before").structured,
    target: normalizeKpScalarSumProductEndpoint({ id: "after", latex: after }, ["x"], "after").structured };
}

test("compound factoring authenticates ordered whole-tree evidence including zero and repeated symbols", () => {
  for (const data of [input(), input("(x+3)*2+(x+3)*3", "(x+3)(2+3)", "left"),
    input("0(x+x)+3(x+x)", "(0+3)(x+x)"), input("2*0+3*0", "(2+3)*0"),
    input("12(x*3)+34(x*3)", "(12+34)(x*3)")]) {
    const proof = verifyKpComposedFactoring(data);
    assert.ok(isKpVerifiedComposedFactoring(proof));
    assert.equal(proof.inverseDistribution.orientation, data.orientation);
    assert.equal(proof.factorCopyIds.length, 2);
    assert.notEqual(proof.factorCopyIds[0], proof.factorCopyIds[1]);
    assert.equal(verifyKpComposedFactoring(data).revisionId, proof.revisionId);
    assert.ok(Object.isFrozen(proof.factor)); assert.ok(Object.isFrozen(proof.coefficients));
    assert.equal(isKpVerifiedComposedFactoring({ ...proof }), false);
    assert.equal(isKpVerifiedComposedFactoring(JSON.parse(JSON.stringify(proof))), false);
  }
});

test("compound factoring rejects altered and commuted trees without sampled or division-based reasoning", () => {
  for (const [before, after] of [
    ["2(x+3)+3(x+4)", "(2+3)(x+3)"], ["2(x+3)+3(x+3)", "(3+2)(x+3)"],
    ["2(x+3)+3(x+3)", "(2+3)(3+x)"], ["2(x+3)+3(x+3)", "(2+4)(x+3)"],
    ["0(x+3)+3(x+3)", "(0+3)(x+4)"]
  ]) assert.throws(() => verifyKpComposedFactoring(input(before, after)),
    (e: unknown) => e instanceof KpComposedFactoringError && e.code === "invalid-factorization");
  assert.throws(() => verifyKpComposedFactoring(input(undefined, undefined, "left")), KpComposedFactoringError);
});

test("direct proof callers cannot bypass symbol, occurrence, tree-size or numeric bounds", () => {
  const data = input();
  assert.throws(() => verifyKpComposedFactoring({ ...data, symbols: [] }), KpComposedFactoringError);
  assert.throws(() => verifyKpComposedFactoring({ ...data, source: data.target }), KpComposedFactoringError);
  for (const value of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Infinity]) {
    const changed = structuredClone(data);
    if (changed.source.root.kind !== "sum" || changed.source.root.terms[0]!.kind !== "product") throw Error("fixture");
    const coefficient = changed.source.root.terms[0]!.factors[0]!;
    Object.assign(coefficient, { value });
    assert.throws(() => verifyKpComposedFactoring(changed), KpComposedFactoringError);
  }
  let deep: KpStructuredExpressionNode = { id: "leaf", kind: "symbol", name: "x" };
  for (let i = 0; i < 13; i++) deep = { id: `sum.${i}`, kind: "sum", terms: [deep, { id: `n.${i}`, kind: "number", value: 1 }] };
  assert.throws(() => verifyKpComposedFactoring({ ...data, source: { ...data.source, root: deep } }), KpComposedFactoringError);
  const cycle = { id: "cycle", kind: "sum" as const, terms: [] as KpStructuredExpressionNode[] };
  cycle.terms.push(cycle, { id: "one", kind: "number", value: 1 });
  assert.throws(() => verifyKpComposedFactoring({ ...data, source: { ...data.source, root: cycle } }), KpComposedFactoringError);
});
