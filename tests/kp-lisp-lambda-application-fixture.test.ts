import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpLispLambdaApplicationFixture,
  evaluateKpLispLambdaApplication,
  KP_LISP_LAMBDA_APPLICATION_SOURCE
} from "../src/semantic/lisp-lambda-application-fixture.ts";

test("derives the certified lambda application independently of motion", () => {
  const fixture = createKpLispLambdaApplicationFixture();

  assert.equal(fixture.semantic.sourceText, KP_LISP_LAMBDA_APPLICATION_SOURCE);
  assert.equal(fixture.evaluation.reconstructed.text, "(+ 4 1)");
  assert.equal(fixture.evaluation.result.exactInteger, 5);
  assert.deepEqual(fixture.evaluation.result.derivedFromExpressionIds, [
    "occurrence.argument.four",
    "occurrence.body.one"
  ]);
});

test("preserves argument and destination provenance through substitution", () => {
  const { evaluation } = createKpLispLambdaApplicationFixture();
  const substituted = evaluation.occurrences.find(({ id }) => id === "derived.argument.four");

  assert.equal(evaluation.bindingId, "binding.x");
  assert.equal(evaluation.environmentId, "environment.application");
  assert.equal(evaluation.destinationId, "destination.body.x");
  assert.deepEqual(substituted?.originExpressionIds, [
    "occurrence.argument.four",
    "occurrence.x.reference"
  ]);
});

test("rejects values outside the bounded certified evaluator", () => {
  const { semantic } = createKpLispLambdaApplicationFixture();
  const changed = {
    ...semantic,
    values: semantic.values.map((value) => value.id === "value.argument.four"
      ? { ...value, exactInteger: 6 }
      : value)
  };

  assert.throws(
    () => evaluateKpLispLambdaApplication(changed),
    /expected the certified lambda-application fixture/
  );
});

test("deep-freezes derived expression and lineage", () => {
  const { evaluation } = createKpLispLambdaApplicationFixture();

  assert.equal(Object.isFrozen(evaluation), true);
  assert.equal(Object.isFrozen(evaluation.reconstructed.occurrenceIds), true);
  assert.equal(Object.isFrozen(evaluation.occurrences[1]?.originExpressionIds), true);
  assert.equal(Object.isFrozen(evaluation.result.derivedFromExpressionIds), true);
});
