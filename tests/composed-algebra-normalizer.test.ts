import assert from "node:assert/strict";
import test from "node:test";
import primary from "../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };
import { readKpComposedAlgebraSource, KpComposedAlgebraRepair } from "../src/authoring/composed-algebra-source.ts";
import { normalizeKpComposedAlgebraEndpoints } from "../src/authoring/composed-algebra-normalizer.ts";
import { listKpStructuredExpressionSubtrees } from "../src/semantic/structured-expression.ts";

test("compound endpoint normalization preserves original spelling and disjoint occurrence IDs", () => {
  const source = readKpComposedAlgebraSource(primary);
  const endpoints = normalizeKpComposedAlgebraEndpoints(source);
  assert.deepEqual(endpoints.map(e => e.authoredLatex), source.states.map(s => s.latex));
  assert.deepEqual(endpoints.map(e => e.structured.root.kind), ["sum", "product", "product"]);
  const nodes = endpoints.flatMap(e => listKpStructuredExpressionSubtrees(e.structured));
  assert.equal(new Set(nodes.map(n => n.id)).size, nodes.length);
  assert.deepEqual(normalizeKpComposedAlgebraEndpoints(source), endpoints);
  const copies = listKpStructuredExpressionSubtrees(endpoints[0].structured).filter(n => n.kind === "symbol" && n.name === "x");
  assert.equal(copies.length, 2);
  assert.notEqual(copies[0]!.id, copies[1]!.id);
});

test("all three state positions retain located parser repairs without guessing identifiers", () => {
  for (const index of [0, 1, 2]) for (const latex of ["sin(x)", "z+3", "x^2", "-2*x", "x/2", "9007199254740992*x"]) {
    const source = readKpComposedAlgebraSource({ ...primary, states: primary.states.map((state, i) => ({ ...state, latex: i === index ? latex : state.latex })) });
    assert.throws(() => normalizeKpComposedAlgebraEndpoints(source),
      (e: unknown) => e instanceof KpComposedAlgebraRepair && e.path === `$.states[${index}].latex`);
  }
});
