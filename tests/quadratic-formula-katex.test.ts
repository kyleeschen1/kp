import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpQuadraticFormulaKatexProjection,
  validateKpQuadraticFormulaKatexProjection
} from "../src/projections/quadratic-formula-katex.ts";

test("formula projection covers substitution through exact roots", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.equal(projection.states.length, 9);
  assert.match(projection.states[0]!.latex, /-b.*\\pm.*\\sqrt/);
  assert.match(
    projection.states.find(({ id }) => id.endsWith(".discriminant"))!.latex,
    /\\sqrt\{1\}/
  );
  assert.equal(
    projection.states.at(-1)?.latex,
    "\\displaystyle x = 2 \\quad\\text{or}\\quad x = 3"
  );
});

test("formula states own native KaTeX and stable semantic selectors", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.deepEqual(validateKpQuadraticFormulaKatexProjection(projection), []);
  assert.ok(projection.states.every(({ ownership }) => ownership === "native-katex"));
  const selectors = projection.states.flatMap(({ selectors }) => selectors.map(({ id }) => id));
  assert.equal(new Set(selectors).size, selectors.length);
});

test("coefficient substitution separates continuants from signed focal groups", () => {
  const substitution =
    createKpQuadraticFormulaKatexProjection().transitions[0]!;
  assert.equal(
    substitution.presentation?.operationRef,
    "operation.quadratic-formula.substitute-coefficients"
  );
  assert.deepEqual(
    substitution.correspondence.map(({ role, presentationRole }) => [
      role,
      presentationRole
    ]),
    [
      ["variable", "continuant"],
      ["negated-b", "focal-operand"],
      ["plus-minus", "continuant"],
      ["signed-b", "focal-operand"],
      ["coefficient-a", "focal-operand"],
      ["coefficient-c", "focal-operand"],
      ["denominator-two", "continuant"],
      ["denominator-a", "focal-operand"]
    ]
  );
  assert.deepEqual(substitution.presentation?.phaseOrder, ["reflow", "act"]);
});

test("discriminant arithmetic preserves exact dependency order", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.deepEqual(
    projection.transitions.slice(1, 5).map(({ id, presentation }) => [
      id,
      presentation?.operationRef
    ]),
    [
      [
        "transition.quadratic.formula.evaluate-b-square",
        "operation.quadratic-formula.evaluate-b-square"
      ],
      [
        "transition.quadratic.formula.evaluate-four-a-c",
        "operation.quadratic-formula.evaluate-four-a-c"
      ],
      [
        "transition.quadratic.formula.subtract-discriminant",
        "operation.quadratic-formula.subtract-discriminant"
      ],
      [
        "transition.quadratic.formula.prepare-denominator",
        "operation.quadratic-formula.prepare-denominator"
      ]
    ]
  );
});

test("radical and candidate evaluation end in branch-ready exact roots", () => {
  const projection = createKpQuadraticFormulaKatexProjection();
  assert.deepEqual(
    projection.transitions.slice(-3).map(({ id, presentation }) => [
      id,
      presentation?.operationRef
    ]),
    [
      [
        "transition.quadratic.formula.simplify-radical",
        "operation.quadratic-formula.simplify-exact-radical"
      ],
      [
        "transition.quadratic.formula.evaluate-candidate-numerators",
        "operation.quadratic-formula.evaluate-candidate-numerators"
      ],
      [
        "transition.quadratic.formula.divide-candidates",
        "operation.quadratic-formula.divide-candidates"
      ]
    ]
  );
  assert.equal(
    projection.radicalBoundary.existingWebglPathReuse,
    "forbidden"
  );
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
