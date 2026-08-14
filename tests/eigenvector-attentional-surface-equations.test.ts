import assert from "node:assert/strict";
import test from "node:test";

import { kpEigenvectorAttentionalFixture } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-math.ts";
import {
  projectKpEigenvectorEquation,
  projectKpEigenvectorGeometryEquationHandoff
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-equations.ts";

test("the geometric survivor becomes the exact equation Av = 3v", () => {
  const equation = projectKpEigenvectorEquation("Av=3v");

  assert.equal(equation.latex, String.raw`A\mathbf{v}=3\mathbf{v}`);
  assert.deepEqual(
    equation.tokens.map(({ latex }) => latex),
    ["A", String.raw`\mathbf{v}`, "=", "3", String.raw`\mathbf{v}`]
  );
});

test("both visible v tokens retain the geometric vector identity", () => {
  const equation = projectKpEigenvectorEquation("Av=3v");
  const vectorTokens = equation.tokens.filter(({ role }) => role === "vector");

  assert.equal(vectorTokens.length, 2);
  assert.ok(vectorTokens.every(({ semanticObjectId }) =>
    semanticObjectId === kpEigenvectorAttentionalFixture.persistentVector.id
  ));
});

test("the handoff names source and destinations without glyph inference", () => {
  const handoff = projectKpEigenvectorGeometryEquationHandoff();

  assert.equal(
    handoff.semanticObjectId,
    kpEigenvectorAttentionalFixture.persistentVector.id
  );
  assert.equal(handoff.sourceRepresentationId, "diagram.vector.v");
  assert.deepEqual(handoff.targetRepresentationIds, [
    "equation.Av3v.v-input",
    "equation.Av3v.v-output"
  ]);
  assert.deepEqual(handoff.sourceCoordinates, [3, 3]);
});

test("unimplemented symbolic endpoints fail closed", () => {
  assert.throws(
    () => projectKpEigenvectorEquation("Av=lambda-v"),
    /not available yet/
  );
});
