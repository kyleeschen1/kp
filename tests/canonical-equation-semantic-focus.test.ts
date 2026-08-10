import assert from "node:assert/strict";
import test from "node:test";
import {
  projectKpCanonicalEquationSemanticFocus
} from "../src/reader/app/canonical-equation-semantic-focus.ts";

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
