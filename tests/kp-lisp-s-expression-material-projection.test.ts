import assert from "node:assert/strict";
import test from "node:test";

import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

test("projects certified atoms and parentheses without reading rendered glyphs", () => {
  const fixture = createKpLispLambdaApplicationFixture();
  const projection = projectKpLispLambdaSourceMaterial(fixture);
  const application = projection.canonicalStates[0]!;

  assert.equal(application.nativeCode, "((lambda (x) (+ x 1)) 4)");
  assert.equal(application.tokens.length, 14);
  assert.equal(new Set(application.tokens.map(({ id }) => id)).size, 14);
  for (const material of application.tokens) {
    assert.equal(
      application.nativeCode.slice(material.source.start, material.source.end),
      material.lexeme
    );
  }
  assert.deepEqual(application.tokens.filter(({ kind }) =>
    kind !== "atom").map(({ ownerExpressionId }) => ownerExpressionId), [
    "expr.application",
    "expr.lambda",
    "expr.parameters",
    "expr.parameters",
    "expr.body",
    "expr.body",
    "expr.lambda",
    "expr.application"
  ]);
});

test("keeps exact canonical application reconstructed and result code", () => {
  const projection = projectKpLispLambdaSourceMaterial(
    createKpLispLambdaApplicationFixture()
  );

  assert.deepEqual(projection.canonicalStates.map(({ id, nativeCode }) => ({
    id,
    nativeCode
  })), [
    { id: "application", nativeCode: "((lambda (x) (+ x 1)) 4)" },
    { id: "reconstructed", nativeCode: "(+ 4 1)" },
    { id: "result", nativeCode: "5" }
  ]);
  assert.deepEqual(
    projection.canonicalStates[1]?.tokens.find(({ id }) =>
      id === "derived.argument.four")?.originIds,
    ["occurrence.argument.four", "occurrence.x.reference"]
  );
});

test("gives every inspection state an exact native-code equivalent", () => {
  const projection = projectKpLispLambdaSourceMaterial(
    createKpLispLambdaApplicationFixture()
  );

  assert.deepEqual(projection.inspectionEquivalents, [
    {
      id: "structure",
      canonicalStateId: "application",
      nativeCode: "((lambda (x) (+ x 1)) 4)"
    },
    {
      id: "binding",
      canonicalStateId: "application",
      nativeCode: "((lambda (x) (+ x 1)) 4)"
    },
    {
      id: "reduction",
      canonicalStateId: "reconstructed",
      nativeCode: "(+ 4 1)"
    }
  ]);
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(Object.isFrozen(projection.canonicalStates[0]?.tokens), true);
});
