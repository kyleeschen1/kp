import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionMergeClozeProjection,
  createKpFractionSplitClozeProjection
} from "../src/animation/semantic-glyph-reconciliation-cloze.ts";

test("fraction merge Cloze masks the settled semantic selector", () => {
  const projection = createKpFractionMergeClozeProjection();

  assert.equal(projection.interactionKind, "cloze");
  assert.deepEqual(projection.diagnostics, []);
  assert.deepEqual(projection.hiddenSelectorIds, [
    "equation.numerator-split-merge.combined.fraction.denominator.2"
  ]);
  assert.equal(projection.clock.progress, 1);
  assert.equal(projection.answer?.kind, "selector");
});

test("fraction merge Cloze contains no transient glyph or pixel authority", () => {
  const serialized = JSON.stringify(createKpFractionMergeClozeProjection());
  assert.doesNotMatch(serialized, /glyph-match|measured|pixel|renderer-session/);
  assert.match(serialized, /transform\.numerator-split-merge\.merge-sum/);
});

test("fraction split Cloze keeps both native target selectors semantic", () => {
  const projection = createKpFractionSplitClozeProjection();

  assert.equal(projection.interactionKind, "cloze");
  assert.deepEqual(projection.diagnostics, []);
  assert.deepEqual(projection.hiddenSelectorIds, [
    "equation.numerator-split-merge.split.left.fraction.denominator.2",
    "equation.numerator-split-merge.split.right.fraction.denominator.2"
  ]);
  assert.equal(projection.clock.progress, 1);
  assert.equal(projection.answer?.kind, "selector");
  const serialized = JSON.stringify(projection);
  assert.doesNotMatch(serialized, /glyph-match|measured|pixel|renderer-session/);
  assert.match(serialized, /transform\.numerator-split-merge\.split-sum/);
});
