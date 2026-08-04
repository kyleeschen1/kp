import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLispFoldSchedule,
  sampleKpLispFoldSchedule
} from "../src/animation/lisp-s-expression-fold-schedule.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

test("collapses same-depth leaves together before their ancestors", () => {
  const schedule = compileKpLispFoldSchedule(
    createKpLispLambdaApplicationFixture().semantic
  );

  assert.equal(schedule.duration, 9);
  assert.deepEqual(schedule.frontiers, [
    { depth: 2, expressionIds: ["expr.parameters", "expr.body"] },
    { depth: 1, expressionIds: ["expr.lambda"] },
    { depth: 0, expressionIds: ["expr.application"] }
  ]);
  assert.deepEqual(schedule.expressions.map(({ expressionId, fold }) => ({
    expressionId,
    contentStart: fold.contents.start,
    parenthesesStart: fold.parentheses.start,
    complete: fold.parentheses.end
  })), [
    { expressionId: "expr.parameters", contentStart: 0, parenthesesStart: 1, complete: 3 },
    { expressionId: "expr.body", contentStart: 0, parenthesesStart: 1, complete: 3 },
    { expressionId: "expr.lambda", contentStart: 3, parenthesesStart: 4, complete: 6 },
    { expressionId: "expr.application", contentStart: 6, parenthesesStart: 7, complete: 9 }
  ]);
});

test("enforces content lead and child completion as schedule laws", () => {
  const schedule = compileKpLispFoldSchedule(
    createKpLispLambdaApplicationFixture().semantic
  );
  const byId = new Map(schedule.expressions.map((entry) => [
    entry.expressionId,
    entry
  ]));

  for (const expression of schedule.expressions) {
    assert.ok(expression.fold.contents.start < expression.fold.parentheses.start);
    for (const childId of expression.childExpressionIds) {
      assert.ok(expression.fold.contents.start >=
        byId.get(childId)!.fold.parentheses.end);
    }
  }
});

test("unfold is the exact sampled inverse of fold", () => {
  const schedule = compileKpLispFoldSchedule(
    createKpLispLambdaApplicationFixture().semantic
  );

  for (let index = 0; index <= 100; index += 1) {
    const progress = index / 100;
    assert.deepEqual(
      sampleKpLispFoldSchedule(schedule, progress, "fold"),
      sampleKpLispFoldSchedule(schedule, 1 - progress, "unfold")
    );
  }
});

test("freezes the schedule and direct samples", () => {
  const schedule = compileKpLispFoldSchedule(
    createKpLispLambdaApplicationFixture().semantic
  );
  const sample = sampleKpLispFoldSchedule(schedule, 0.5, "fold");

  assert.equal(Object.isFrozen(schedule), true);
  assert.equal(Object.isFrozen(schedule.expressions), true);
  assert.equal(Object.isFrozen(schedule.expressions[0]?.fold), true);
  assert.equal(Object.isFrozen(sample), true);
  assert.equal(Object.isFrozen(sample[0]), true);
});
