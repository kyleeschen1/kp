import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCompletingSquareKatexProjection,
  validateKpCompletingSquareKatexProjection
} from "../src/projections/quadratic-completing-square-katex.ts";

test("completing-square projection has four native KaTeX states", () => {
  const projection = createKpCompletingSquareKatexProjection();
  assert.deepEqual(projection.states.map(({ latex }) => latex), [
    "x^2 - 5x + 6 = 0",
    "x^2 - 5x = -6",
    "x^2 - 5x + \\frac{25}{4} = \\frac{1}{4}",
    "\\left(x - \\frac{5}{2}\\right)^2 = \\frac{1}{4}"
  ]);
  assert.ok(projection.states.every(({ ownership }) => ownership === "native-katex"));
});

test("stable selectors bind semantic roles across each transition", () => {
  const projection = createKpCompletingSquareKatexProjection();
  assert.deepEqual(validateKpCompletingSquareKatexProjection(projection), []);
  assert.ok(projection.transitions.every(({ correspondence }) => correspondence.length >= 2));
  assert.equal(
    new Set(projection.states.flatMap(({ selectors }) => selectors.map(({ id }) => id))).size,
    projection.states.flatMap(({ selectors }) => selectors).length
  );
});

test("transitions require measured native endpoints and collision-safe lanes", () => {
  const projection = createKpCompletingSquareKatexProjection();
  for (const transition of projection.transitions) {
    assert.deepEqual(transition.layout, {
      measurement: "native-dom-rect",
      collisionPolicy: "role-lanes",
      endpointOwnership: "native-source-and-target"
    });
  }
});

test("balance reflows persistent context before only the constant acts", () => {
  const balance = createKpCompletingSquareKatexProjection().transitions[0]!;
  const presentation = balance.presentation;
  assert.ok(presentation);
  assert.equal(
    presentation.operationRef,
    "rewrite.quadratic.completing-square.balance-constant"
  );
  assert.deepEqual(presentation.phaseOrder, ["reflow", "act"]);
  assert.deepEqual(
    balance.correspondence.map(({ role, presentationRole }) => [
      role,
      presentationRole
    ]),
    [
      ["quadratic", "continuant"],
      ["linear", "continuant"],
      ["equals", "continuant"],
      ["relocated-constant", "focal-operand"]
    ]
  );
});

test("projection contains no radical workaround or concrete geometry", () => {
  const serialized = JSON.stringify(createKpCompletingSquareKatexProjection());
  assert.doesNotMatch(serialized, /webgl|radical-structural|translateX|translateY/);
});

test("projection is deeply immutable and JSON-stable", () => {
  const projection = createKpCompletingSquareKatexProjection();
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(Object.isFrozen(projection.states), true);
  assert.equal(Object.isFrozen(projection.transitions), true);
  assert.equal(Object.isFrozen(projection.transitions[0]?.correspondence), true);
  assert.deepEqual(JSON.parse(JSON.stringify(projection)), projection);
});
