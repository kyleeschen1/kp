import assert from "node:assert/strict";
import test from "node:test";
import {
  compileKpCanonicalEquationSemanticFocusLineage,
  projectKpCanonicalEquationSemanticFocus
} from "../src/reader/app/canonical-equation-semantic-focus.ts";
import type {
  KpReaderEquationRenderPlan
} from "../src/reader/renderers/equation-render-plan.ts";

test("story scope does not paint whole equations as visual focus", () => {
  const projection = projectKpCanonicalEquationSemanticFocus({
    snapshot: {
      activeSource: "story",
      objectRefs: ["equation.whole", "selector.term"],
      revision: 1
    },
    equationObjectRefs: new Set(["equation.whole"])
  });
  assert.deepEqual(projection, {
    activeSource: "story",
    visualFocusRefs: ["selector.term"]
  });
});

test("direct semantic focus retains equation and selector refs", () => {
  const projection = projectKpCanonicalEquationSemanticFocus({
    snapshot: {
      activeSource: "pointer",
      objectRefs: ["equation.whole", "selector.term"],
      revision: 1
    },
    equationObjectRefs: new Set(["equation.whole"])
  });
  assert.deepEqual(projection.visualFocusRefs, [
    "equation.whole",
    "selector.term"
  ]);
});

test("semantic focus follows selector lineage across hidden endpoints", () => {
  const lineage = compileKpCanonicalEquationSemanticFocusLineage([{
    transitions: [{
      relations: [{
        sourceSelectorIds: ["factor.source"],
        targetSelectorIds: ["factor.copy.x", "factor.copy.six"]
      }, {
        sourceSelectorIds: ["factor.copy.x"],
        targetSelectorIds: ["numerator.x"]
      }]
    }]
  } as unknown as KpReaderEquationRenderPlan]);
  assert.deepEqual(new Set(lineage.expand(["factor"])), new Set([
    "factor",
    "factor.source",
    "factor.copy.x",
    "factor.copy.six",
    "numerator.x"
  ]));
});
