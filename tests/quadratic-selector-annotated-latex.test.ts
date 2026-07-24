import assert from "node:assert/strict";
import test from "node:test";

import { createKpCompletingSquareKatexProjection } from "../src/projections/quadratic-completing-square-katex.ts";
import { createKpQuadraticFormulaKatexProjection } from "../src/projections/quadratic-formula-katex.ts";
import { createKpQuadraticSelectorAnnotatedLatex } from "../src/rendering/quadratic-selector-annotated-latex.ts";

test("quadratic native KaTeX annotations preserve every authored equation", () => {
  const states = [
    ...createKpCompletingSquareKatexProjection().states,
    ...createKpQuadraticFormulaKatexProjection().states
  ];
  for (const state of states) {
    const annotated = createKpQuadraticSelectorAnnotatedLatex(state);
    assert.equal(annotated.rawLatex, state.latex);
    assert.deepEqual(
      annotated.annotations.map(({ motionId }) => motionId),
      state.selectors.map(({ id }) => id)
    );
  }
});

test("formula radical annotations stay native and contain no WebGL handoff", () => {
  const formula = createKpQuadraticFormulaKatexProjection();
  const serialized = JSON.stringify(
    formula.states.map(createKpQuadraticSelectorAnnotatedLatex)
  );
  assert.match(serialized, /sqrt/);
  assert.doesNotMatch(serialized, /webgl|material-owner|radical-structural/i);
});
