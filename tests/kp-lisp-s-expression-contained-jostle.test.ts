import assert from "node:assert/strict";
import test from "node:test";

import { projectKpLispContainedJostle } from
  "../src/animation/lisp-s-expression-contained-jostle.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const application = projectKpLispLambdaSourceMaterial(
  createKpLispLambdaApplicationFixture()
).canonicalStates[0]!;

test("projects seeded jostle deterministically without a history clock", () => {
  const first = projectKpLispContainedJostle(application, "expr.body", 0.37);
  const afterUnrelatedSeeks = [0.91, 0.03, 0.62].map((progress) =>
    projectKpLispContainedJostle(application, "expr.body", progress));
  const second = projectKpLispContainedJostle(application, "expr.body", 0.37);

  assert.deepEqual(second, first);
  assert.equal(afterUnrelatedSeeks.length, 3);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.poses), true);
  assert.equal(Object.isFrozen(first.poses[0]), true);
});

test("keeps every atom ordered and inside its parenthesis membrane", () => {
  for (let step = 0; step <= 100; step += 1) {
    const frame = projectKpLispContainedJostle(
      application,
      "expr.body",
      step / 100
    );
    for (const membrane of frame.membranes) {
      const poses = frame.poses.filter(({ ownerExpressionId }) =>
        ownerExpressionId === membrane.expressionId);
      assert.ok(poses.every(({ inline, block }) =>
        inline > 0 && inline < 1 && block > 0 && block < 1));
      assert.deepEqual(
        poses.map(({ sourceOrder }) => sourceOrder),
        [...poses.map(({ sourceOrder }) => sourceOrder)].sort((a, b) => a - b)
      );
      for (let index = 1; index < poses.length; index += 1) {
        assert.ok(poses[index - 1]!.inline < poses[index]!.inline);
      }
    }
  }
});

test("moves only atoms owned by the active expression", () => {
  const frame = projectKpLispContainedJostle(application, "expr.body", 0.41);
  const active = frame.poses.filter(({ active }) => active);
  const inactive = frame.poses.filter(({ active }) => !active);

  assert.deepEqual(active.map(({ materialId }) => materialId), [
    "occurrence.plus",
    "occurrence.x.reference",
    "occurrence.body.one"
  ]);
  assert.ok(active.some(({ inlineOffset, blockOffset }) =>
    inlineOffset !== 0 || blockOffset !== 0));
  assert.ok(inactive.every(({ inlineOffset, blockOffset }) =>
    inlineOffset === 0 && blockOffset === 0));
});

test("returns exact endpoint settlement and reverse direct-seek samples", () => {
  const forward = Array.from({ length: 21 }, (_, index) =>
    projectKpLispContainedJostle(application, "expr.body", index / 20));
  const reverse = Array.from({ length: 21 }, (_, index) =>
    projectKpLispContainedJostle(application, "expr.body", (20 - index) / 20));

  assert.deepEqual(reverse, [...forward].reverse());
  for (const endpoint of [forward[0]!, forward.at(-1)!]) {
    assert.ok(endpoint.poses.every(({ inlineOffset, blockOffset }) =>
      inlineOffset === 0 && blockOffset === 0));
  }
});

test("requires an active expression backed by certified source material", () => {
  assert.throws(
    () => projectKpLispContainedJostle(application, "expr.unknown", 0.5),
    /no certified atom material/
  );
});
