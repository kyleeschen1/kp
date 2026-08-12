import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSchemeFactorialStructuralChoreography,
  sampleKpSchemeStructuralTransition
} from "../src/animation/scheme-factorial-structural-choreography.ts";
import { kpSchemeFactorialCheckpoints } from
  "../src/semantic/scheme-factorial-checkpoints.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";

const choreography = compileKpSchemeFactorialStructuralChoreography({
  document: parseKpSchemeFactorialSource(),
  checkpoints: kpSchemeFactorialCheckpoints
});
const transition = (suffix: string) => choreography.transitions.find(({ id }) =>
  id.endsWith(suffix))!;

test("compiles three bounded structural transitions", () => {
  assert.deepEqual(choreography.transitions.map(({ id }) => id), [
    "scheme-factorial.structural.definition-to-seed",
    "scheme-factorial.structural.seed-to-first-descent",
    "scheme-factorial.structural.first-to-repeated-descent"
  ]);
  assert.equal(Object.isFrozen(choreography), true);
  assert.equal(Object.isFrozen(choreography.transitions[0]?.expressionMotions),
    true);
});

test("folding moves deepest lists first and lets contents lead membranes", () => {
  const fold = transition("definition-to-seed");
  const deepest = Math.max(...fold.expressionMotions.map(({ depth }) => depth));
  const root = fold.expressionMotions.find(({ depth }) => depth === 0)!;
  const leaf = fold.expressionMotions.find(({ depth }) => depth === deepest)!;
  assert.ok(leaf.contentInterval[0] < root.contentInterval[0]);
  for (const motion of fold.expressionMotions) {
    assert.ok(motion.contentInterval[0] < motion.membraneInterval[0]);
    assert.ok(motion.contentInterval[1] < motion.membraneInterval[1]);
  }
  for (let index = 0; index <= 200; index += 1) {
    const frame = sampleKpSchemeStructuralTransition(fold, index / 200);
    for (const parent of frame.expressions) {
      const descendants = frame.expressions.filter(({ expressionId, depth }) =>
        depth > parent.depth && expressionId.startsWith(parent.expressionId));
      if (parent.contentProgress > 0) {
        assert.ok(descendants.every(({ membraneProgress }) =>
          membraneProgress === 1));
      }
    }
  }
});

test("bloom reverses the membrane-content dependency", () => {
  const bloom = transition("seed-to-first-descent");
  for (const motion of bloom.expressionMotions) {
    assert.ok(motion.membraneInterval[0] < motion.contentInterval[0]);
    assert.ok(motion.membraneInterval[1] < motion.contentInterval[1]);
  }
  assert.ok(bloom.expressionMotions.some(({ depth }) => depth > 1));
});

test("waiting shells persist and new shells enter sequentially", () => {
  const first = transition("seed-to-first-descent");
  const repeated = transition("first-to-repeated-descent");
  assert.equal(first.waitingShells.length, 1);
  assert.equal(first.waitingShells[0]?.state, "entering");
  assert.equal(repeated.waitingShells.filter(({ state }) =>
    state === "persistent").length, 1);
  assert.equal(repeated.waitingShells.filter(({ state }) =>
    state === "entering").length, 2);
  const middle = sampleKpSchemeStructuralTransition(repeated, 0.25);
  assert.equal(middle.waitingShells.find(({ state }) =>
    state === "persistent")?.progress, 1);
  const entering = middle.waitingShells.filter(({ state }) =>
    state === "entering");
  assert.ok(entering.some(({ progress }) => progress > 0));
  assert.ok(entering.some(({ progress }) => progress === 0));
});

test("direct seek and reverse sampling are history independent", () => {
  for (const item of choreography.transitions) {
    const ascending = Array.from({ length: 101 }, (_, index) =>
      sampleKpSchemeStructuralTransition(item, index / 100));
    const descending = Array.from({ length: 101 }, (_, index) =>
      sampleKpSchemeStructuralTransition(item, (100 - index) / 100)).reverse();
    assert.deepEqual(descending, ascending);
    assert.throws(() => sampleKpSchemeStructuralTransition(item, Number.NaN),
      /finite/);
  }
});
