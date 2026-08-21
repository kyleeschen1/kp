import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_RADICAL_ENDPOINT_NORMALIZER,
  normalizeKpRadicalEndpoint
} from "../src/semantic/radical-endpoint-normalizer.ts";

test("normalizes power base exponent and authored grouping", () => {
  const square = requireNormalized("(x+1)^{2}");
  assert.equal(square.notation, "power");
  if (square.notation !== "power") return;
  assert.deepEqual(square.base, {
    role: "power-base",
    rawLatex: "(x+1)",
    grouping: "parentheses",
    expression: {
      kind: "binary",
      operator: "+",
      left: { kind: "identifier", name: "x" },
      right: { kind: "number", value: 1 }
    }
  });
  assert.equal(square.exponent.rawLatex, "{2}");
  assert.equal(square.exponent.contentLatex, "2");
  assert.equal(square.exponent.grouping, "braces");
  assert.equal(square.exponent.classification, "even-integer");
});

test("normalizes implicit square odd and symbolic radical indices", () => {
  const square = requireNormalized("\\sqrt{x}");
  const cube = requireNormalized("\\sqrt[3]{x+1}");
  const symbolic = requireNormalized("\\sqrt[n]{x}");
  assert.equal(square.notation, "radical");
  assert.equal(cube.notation, "radical");
  assert.equal(symbolic.notation, "radical");
  if (
    square.notation !== "radical" || cube.notation !== "radical" ||
    symbolic.notation !== "radical"
  ) return;
  assert.deepEqual([
    square.index.provenance,
    square.index.contentLatex,
    square.index.classification
  ], ["implicit-square", "2", "even-integer"]);
  assert.deepEqual([
    cube.index.provenance,
    cube.index.rawLatex,
    cube.index.classification
  ], ["explicit", "[3]", "odd-integer"]);
  assert.equal(symbolic.index.classification, "symbolic");
  assert.equal(cube.radicand.contentLatex, "x+1");
});

test("nested radicals retain radicand structure and source spelling", () => {
  const endpoint = requireNormalized("\\sqrt{\\sqrt{x}} ");
  assert.equal(endpoint.rawLatex, "\\sqrt{\\sqrt{x}}");
  assert.equal(endpoint.notation, "radical");
  if (endpoint.notation !== "radical") return;
  assert.equal(endpoint.radicand.rawLatex, "{\\sqrt{x}}");
  assert.equal(endpoint.radicand.nestedRadical, true);
  assert.deepEqual(endpoint.radicand.expression, {
    kind: "call",
    name: "sqrt",
    argument: { kind: "identifier", name: "x" }
  });
});

test("normalization cannot infer equation branches or domains", () => {
  for (const latex of ["x^2", "x^3", "\\sqrt{x}", "\\sqrt[3]{x}"]) {
    const endpoint = requireNormalized(latex);
    assert.equal(endpoint.authority, KP_RADICAL_ENDPOINT_NORMALIZER);
    assert.deepEqual(endpoint.inversionBoundary, {
      equationRelationRequired: true,
      solutionBranches: "not-inferred",
      domainConditions: "not-inferred"
    });
    assert.doesNotMatch(JSON.stringify(endpoint), /positive-branch|negative-branch|principal-value/u);
  }
});

test("malformed and non-root shapes fail with typed repair", () => {
  for (const latex of [
    "x+1",
    "\\sqrt[] {x}",
    "\\sqrt[3{x}",
    "\\sqrt[3]x",
    "\\sqrt{x}y",
    "x^"
  ]) {
    const result = normalizeKpRadicalEndpoint(latex);
    assert.equal(result.status, "unsupported-shape", latex);
    if (result.status === "unsupported-shape") {
      assert.match(result.diagnostic.code, /^radical-endpoint\./u);
      assert.match(result.diagnostic.repair, /later equation operation/u);
    }
  }
});

function requireNormalized(latex: string) {
  const result = normalizeKpRadicalEndpoint(latex);
  assert.equal(result.status, "normalized", latex);
  if (result.status !== "normalized") {
    throw new Error(`Expected ${latex} to normalize.`);
  }
  assert.equal(Object.isFrozen(result), true);
  return result.endpoint;
}
