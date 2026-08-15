import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogExponentSolveStates,
  listKpLogExponentExpressionNodes
} from "../src/semantic/log-exponent-solve-states.ts";

test("canonical log-exponent states encode the exact approved equation sequence", () => {
  assert.deepEqual(
    kpCanonicalLogExponentSolveStates.map(({ id, kind, latex }) => ({ id, kind, latex })),
    [
      { id: "log-exponent.state.source", kind: "source-equation", latex: "2^x=7" },
      { id: "log-exponent.state.logged-both-sides", kind: "logged-both-sides", latex: "\\ln(2^x)=\\ln 7" },
      { id: "log-exponent.state.exponent-extracted", kind: "exponent-extracted", latex: "x\\ln 2=\\ln 7" },
      { id: "log-exponent.state.solved", kind: "solved-equation", latex: "x=\\frac{\\ln 7}{\\ln 2}" }
    ]
  );
});

test("canonical states preserve semantic identity while occurrence identity stays unique", () => {
  for (const state of kpCanonicalLogExponentSolveStates) {
    const nodes = listKpLogExponentExpressionNodes(state);
    assert.equal(new Set(nodes.map(({ id }) => id)).size, nodes.length);
    assert.equal(nodes[0]?.kind, "equality");
    assert.ok(nodes.some(({ semanticId }) => semanticId === "semantic.unknown.x"));
    assert.ok(nodes.some(({ semanticId }) => semanticId === "semantic.base.two"));
    assert.ok(nodes.some(({ semanticId }) => semanticId === "semantic.value.seven"));
  }
  const wrapped = kpCanonicalLogExponentSolveStates[1]!;
  assert.equal(wrapped.equation.left.kind, "natural-log");
  assert.equal(wrapped.equation.right.kind, "natural-log");
  const extracted = kpCanonicalLogExponentSolveStates[2]!;
  assert.equal(extracted.equation.left.kind, "product");
  const solved = kpCanonicalLogExponentSolveStates[3]!;
  assert.equal(solved.equation.right.kind, "quotient");
});
