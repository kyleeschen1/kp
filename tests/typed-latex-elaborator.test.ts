import { strict as assert } from "node:assert";
import test from "node:test";

import {
  elaborateKpTypedLatexEquation,
  elaborateKpTypedLatexFunction
} from "../src/math/typed-latex-elaborator.ts";
import {
  createKpScalarParameter,
  deriveKpJacobian,
  evaluateKpTypedMatrix,
  isKpTypedVectorFunction,
  projectKpTypedMathToLatex
} from "../src/math/typed-semantic-math.ts";

const x = createKpScalarParameter({ id: "latex.parameter.x", name: "x" });
const y = createKpScalarParameter({ id: "latex.parameter.y", name: "y" });

test("bounded LaTeX elaboration produces a typed vector function and Jacobian", () => {
  const result = elaborateKpTypedLatexFunction({
    id: "latex.function.affine",
    sourceId: "article.math.affine",
    revisionId: "revision.7",
    latex: String.raw`f(x,y)=\begin{bmatrix}2*x+y\\x-3*y\end{bmatrix}`,
    parameters: [x, y] as const
  });

  assert.equal(result.status, "elaborated");
  if (result.status !== "elaborated") return;
  assert.equal(result.value.output.kind, "typed-vector");
  assert.equal(isKpTypedVectorFunction(result.value), true);
  if (!isKpTypedVectorFunction(result.value)) return;

  assert.deepEqual(result.value.type, {
    kind: "function",
    inputs: [{ kind: "scalar" }, { kind: "scalar" }],
    output: { kind: "vector", size: 2 }
  });
  assert.equal(
    projectKpTypedMathToLatex(result.value),
    "f(x, y) = \\begin{bmatrix}2 x + y \\\\ x - 3 y\\end{bmatrix}"
  );
  assert.deepEqual(result.sourceSpans.map(({ entityId }) => entityId), [
    "latex.function.affine.output.0",
    "latex.function.affine.output.1"
  ]);
  assert.deepEqual(result.value.output.entries[0]?.provenance, {
    kind: "parsed",
    sourceId: "article.math.affine",
    startOffset: 22,
    endOffset: 27,
    revisionId: "revision.7"
  });

  const jacobian = deriveKpJacobian({
    id: "latex.jacobian.affine",
    source: result.value
  });
  assert.deepEqual(evaluateKpTypedMatrix(jacobian.matrix, {}), [
    [2, 1],
    [1, -3]
  ]);
});

test("scalar equations elaborate against an explicit symbol environment", () => {
  const p = createKpScalarParameter({ id: "latex.parameter.P", name: "P" });
  const q = createKpScalarParameter({ id: "latex.parameter.Q", name: "Q" });
  const result = elaborateKpTypedLatexEquation({
    id: "latex.equation.inverse-demand",
    sourceId: "article.math.inverse-demand",
    latex: "P = 12 - Q",
    symbols: [p, q]
  });

  assert.equal(result.status, "elaborated");
  if (result.status !== "elaborated") return;
  assert.equal(result.value.left.id, "latex.equation.inverse-demand.left");
  assert.equal(result.value.right.id, "latex.equation.inverse-demand.right");
  assert.equal(projectKpTypedMathToLatex(result.value), "P = -Q + 12");
  assert.deepEqual(result.sourceSpans.map(({ startOffset, endOffset }) => ({
    startOffset,
    endOffset
  })), [
    { startOffset: 0, endOffset: 1 },
    { startOffset: 4, endOffset: 10 }
  ]);
});

test("unsupported semantics return typed repair gaps instead of fallback math", () => {
  const unknown = elaborateKpTypedLatexFunction({
    id: "latex.function.unknown",
    sourceId: "article.math.unknown",
    latex: "f(x)=x+z",
    parameters: [x] as const
  });
  assert.equal(unknown.status, "repair-required");
  if (unknown.status === "repair-required") {
    assert.equal(unknown.diagnostics[0].code, "typed-latex.unknown-symbol");
    assert.match(unknown.diagnostics[0].message, /undeclared symbol z/);
  }

  const ragged = elaborateKpTypedLatexFunction({
    id: "latex.function.ragged",
    sourceId: "article.math.ragged",
    latex: String.raw`f(x,y)=\begin{bmatrix}x&y\\x\end{bmatrix}`,
    parameters: [x, y] as const
  });
  assert.equal(ragged.status, "repair-required");
  if (ragged.status === "repair-required") {
    assert.equal(ragged.diagnostics[0].code, "typed-latex.shape");
    assert.match(ragged.diagnostics[0].repair, /rectangular bmatrix/);
  }

  const signature = elaborateKpTypedLatexFunction({
    id: "latex.function.signature",
    sourceId: "article.math.signature",
    latex: "f(y,x)=x+y",
    parameters: [x, y] as const
  });
  assert.equal(signature.status, "repair-required");
  if (signature.status === "repair-required") {
    assert.equal(signature.diagnostics[0].code, "typed-latex.signature");
  }
});
