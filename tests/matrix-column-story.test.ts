import assert from "node:assert/strict";
import test from "node:test";
import { empty, matrixEnvironment, matrixColumnStory, MatrixColumnGap, sampleStory, timeline } from "../src/experiments/matrix-column-product/score.ts";

test("column-first presentation retains immutable checked cell identities and values", () => {
  const env = matrixEnvironment();
  const story = matrixColumnStory(env);
  assert.equal(story.state.env, env);
  assert.ok(Object.isFrozen(env.cells[0]!.left));
  assert.deepEqual(env.cells.map(c => c.result), [4, 4, 10, 8]);
  assert.equal(new Set(env.cells.map(c => c.resultId)).size, 4);
  assert.equal(env.cells[0]!.rightIds[0], env.cells[2]!.rightIds[0]);
  assert.notEqual(env.cells[0]!.leftIds[0], env.cells[2]!.leftIds[0]);
  assert.equal(story.steps.length, 13);
  assert.equal(story.steps[6]!.scene.column, 0);
  assert.equal(story.steps[7]!.scene.column, 1);
});

test("named transforms preserve predecessors and reject unsupported order and foreign environments", () => {
  const env = matrixEnvironment();
  const start = empty(env).transform("initial", "Show operands", s => s.show());
  const lifted = start.transform("lift", "Lift", s => s.lift(0));
  assert.equal(start.state.scene.action, "initial");
  assert.equal(lifted.state.scene.action, "lift");
  assert.throws(() => start.transform("wrong", "", s => s.evaluate()), MatrixColumnGap);
  assert.throws(() => start.transform("initial", "", s => s.lift(0)), MatrixColumnGap);
  assert.throws(() => start.transform("foreign", "", () => empty(matrixEnvironment()).state.show().lift(0)), MatrixColumnGap);
  assert.throws(() => timeline(start), MatrixColumnGap);
});

test("direct seeks, reverse traversal and interruption project identical named states", () => {
  const story = matrixColumnStory();
  const { stops } = timeline(story);
  for (const [index, p] of stops.entries()) {
    assert.equal(sampleStory(story, p).index, index);
    assert.equal(sampleStory(story, p).local, 1);
  }
  const forward = [.12, .5, .9].map(p => sampleStory(story, p));
  const reverse = [.9, .5, .12].map(p => sampleStory(story, p)).reverse();
  assert.deepEqual(forward, reverse);
  assert.throws(() => sampleStory(story, NaN), MatrixColumnGap);
  assert.equal(sampleStory(story, 10).step.name, "complete");
});
