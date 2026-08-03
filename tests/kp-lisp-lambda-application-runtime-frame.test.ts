import assert from "node:assert/strict";
import test from "node:test";

import { sampleKpLispLambdaApplicationRuntimeFrame } from "../src/animation/lisp-lambda-application-runtime-frame.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";

const asset = createKpLispLambdaApplicationAsset();
const sample = (progress: number) =>
  sampleKpLispLambdaApplicationRuntimeFrame({ asset, progress });

test("Lisp runtime projects the five deterministic choreography stages", () => {
  assert.deepEqual(
    [0, 0.2, 0.5, 0.8, 1].map((progress) => sample(progress).stage),
    ["read", "bind", "substitute", "evaluate", "settle"]
  );
  assert.equal(sample(0).expressions.applicationOpacity, 1);
  assert.equal(sample(1).expressions.resultOpacity, 1);
  assert.equal(sample(1).expressions.result, "5");
});

test("every frame accounts for every material ledger entry exactly once", () => {
  for (let index = 0; index <= 100; index += 1) {
    const frame = sample(index / 100);
    assert.deepEqual(
      frame.material.map(({ id }) => id),
      asset.materialLedger.map(({ id }) => id)
    );
    assert.equal(new Set(frame.material.map(({ id }) => id)).size, 5);
    assert.ok(frame.material.every(({ transitionProgress }) =>
      transitionProgress >= 0 && transitionProgress <= 1
    ));
  }
});

test("direct seek and rewind sampling are history-independent", () => {
  const ascending = Array.from({ length: 101 }, (_, index) => sample(index / 100));
  const descending = Array.from(
    { length: 101 },
    (_, index) => sample((100 - index) / 100)
  ).reverse();

  assert.deepEqual(descending, ascending);
  for (const progress of [0, 0.17, 0.34, 0.7, 0.94, 1]) {
    assert.deepEqual(sample(progress), sample(progress));
  }
});

test("checkpoint focus derives from semantic selectors", () => {
  assert.deepEqual(sample(0).activeSelectorIds, [
    "selector.lisp.input.application"
  ]);
  assert.ok(sample(0.3).activeSelectorIds.includes(
    "selector.lisp.environment.binding-x"
  ));
  assert.deepEqual(sample(1).activeSelectorIds, [
    "selector.lisp.result.five"
  ]);
});

test("invalid progress is rejected while bounded progress clamps", () => {
  assert.equal(sample(-1).progress, 0);
  assert.equal(sample(2).progress, 1);
  assert.throws(() => sample(Number.NaN), /finite/);
});
