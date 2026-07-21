import assert from "node:assert/strict";
import test from "node:test";

import {
  createFractionalLinearEquationKpAsset
} from "../src/semantic/fractional-linear-equation-asset.ts";
import {
  createKpFractionalLinearSelectorAnnotatedLatex
} from "../src/rendering/fractional-linear-selector-annotated-latex.ts";

test("fractional equation exposes semantic ink and KaTeX-owned structural roles", () => {
  const asset = createFractionalLinearEquationKpAsset();
  const states = asset.bundle.objects.map((state) => ({
    state,
    compiled: createKpFractionalLinearSelectorAnnotatedLatex(state)
  }));
  assert.ok(states.every(({ compiled }) => compiled !== undefined));
  for (const { state, compiled } of states) {
    assert.ok(compiled);
    const semanticIds = state.selectors
      .filter((selector) => selector.kind !== "artifact")
      .map((selector) => selector.id);
    assert.deepEqual(compiled.annotated.annotations.map((annotation) => annotation.selectorId), semanticIds);
  }
  const multiplied = states.find(({ state }) => state.id.endsWith(".multiplied"))?.compiled;
  assert.ok(multiplied);
  assert.deepEqual(multiplied.structuralSelectorIds.map((id) => id.split(".").at(-1)), [
    "left-paren", "rule", "right-paren"
  ]);
  assert.match(multiplied.annotated.rawLatex, /2\\left\(\\frac\{x\}\{2\}\\right\)/);
});
