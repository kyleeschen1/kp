import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "../src/authoring/algebra/compile.ts";
import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };
import {
  compileKpCanonicalEquationSemanticFocusLineage,
  canonicalEquationPaintRevision,
  projectKpCanonicalEquationSemanticFocus
} from "../src/reader/app/canonical-equation-semantic-focus.ts";
import type {
  KpReaderEquationRenderPlan
} from "../src/reader/renderers/equation-render-plan.ts";

test('different narrative scopes share preparation only when projected mathematical paint is identical', () => {
  const project = (objectRefs: readonly string[]) => projectKpCanonicalEquationSemanticFocus({
    snapshot: { activeSource: 'story', objectRefs, revision: 1 },
    equationObjectRefs: new Set(['equation.first', 'equation.second'])
  });
  const first = canonicalEquationPaintRevision(project(['equation.first', 'x']), 'none');
  assert.equal(first, canonicalEquationPaintRevision(project(['equation.second', 'x']), 'none'));
  assert.notEqual(first, canonicalEquationPaintRevision(project(['equation.second', 'y']), 'none'));
  assert.notEqual(first, canonicalEquationPaintRevision({ activeSource: 'pointer', visualFocusRefs: ['x'] }, 'none'));
  assert.notEqual(first, canonicalEquationPaintRevision(project(['x']), 'theme-changed'));
  assert.equal(canonicalEquationPaintRevision(project(['x', 'y', 'x']), 'none'), canonicalEquationPaintRevision(project(['y', 'x']), 'none'));
});

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

test("focus crosses issued native view partitions in either direction without absorbing unrelated groups", () => {
  const { handoffs } = compile(source);
  const lineage = compileKpCanonicalEquationSemanticFocusLineage([], handoffs);
  for (const coverage of handoffs[0].coverage) {
    const expected = new Set([coverage.sourceSelectorId, ...coverage.targetSelectorIds]);
    for (const selector of expected) assert.deepEqual(new Set(lineage.expand([selector])), expected);
  }
  assert.deepEqual(lineage.expand(["unrelated"]), ["unrelated"]);
  assert.throws(() => Reflect.apply(compileKpCanonicalEquationSemanticFocusLineage, undefined,
    [[], [{ coverage: handoffs[0].coverage }]]), /issued endpoint handoffs/);
});
