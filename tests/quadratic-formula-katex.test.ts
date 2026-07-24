import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpQuadraticFormulaKatexProjection,
  validateKpQuadraticFormulaKatexProjection
} from "../src/projections/quadratic-formula-katex.ts";

test("formula projection covers substitution through exact roots", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.equal(projection.states.length, 5);
  assert.match(projection.states[0]!.latex, /-b.*\\pm.*\\sqrt/);
  assert.match(projection.states[2]!.latex, /\\sqrt\{1\}/);
  assert.equal(projection.states.at(-1)?.latex, "\\displaystyle x \\in \\{2,3\\}");
});

test("formula states own native KaTeX and stable semantic selectors", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.deepEqual(validateKpQuadraticFormulaKatexProjection(projection), []);
  assert.ok(projection.states.every(({ ownership }) => ownership === "native-katex"));
  const selectors = projection.states.flatMap(({ selectors }) => selectors.map(({ id }) => id));
  assert.equal(new Set(selectors).size, selectors.length);
});

test("formula radical stays isolated from the existing workaround", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.deepEqual(projection.radicalBoundary, {
    rendering: "native-katex",
    existingWebglPathReuse: "forbidden"
  });
  assert.doesNotMatch(JSON.stringify(projection), /radical-structural|material-owner/i);
});

test("formula transitions measure and settle native endpoints", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.ok(projection.transitions.every(({ layout }) =>
    layout.measurement === "native-dom-rect" &&
    layout.endpointOwnership === "native-source-and-target"
  ));
});

test("formula projection is deeply immutable and JSON-stable", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(Object.isFrozen(projection.states), true);
  assert.equal(Object.isFrozen(projection.transitions), true);
  assert.equal(Object.isFrozen(projection.radicalBoundary), true);
  assert.deepEqual(JSON.parse(JSON.stringify(projection)), projection);
});
