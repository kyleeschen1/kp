import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEigenvectorExperienceState,
  updateKpEigenvectorExperience
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-experience-state.ts";

test("scroll and transport selection share one transition authority", () => {
  const initial = createKpEigenvectorExperienceState();
  const selected = updateKpEigenvectorExperience(initial, {
    type: "select-beat",
    beatId: "watch-the-fan"
  });
  const next = updateKpEigenvectorExperience(selected.state, {
    type: "move",
    direction: "next"
  });

  assert.deepEqual(selected.effects, [{
    type: "transition",
    fromBeatId: "most-vectors-turn",
    toBeatId: "watch-the-fan"
  }]);
  assert.equal(next.state.beatId, "one-direction-survives");
  assert.equal(next.effects[0]?.type, "transition");
});

test("incorrect prediction explains but does not reveal", () => {
  const prompt = createKpEigenvectorExperienceState("predict-a-multiple");
  const update = updateKpEigenvectorExperience(prompt, {
    type: "answer-prediction",
    choiceId: "maps-to-3v"
  });

  assert.equal(update.state.beatId, "predict-a-multiple");
  assert.equal(update.state.prediction?.correct, false);
  assert.deepEqual(update.effects.map(({ type }) => type), ["announce"]);
});

test("correct prediction announces and then reveals the consequence", () => {
  const prompt = createKpEigenvectorExperienceState("predict-a-multiple");
  const update = updateKpEigenvectorExperience(prompt, {
    type: "answer-prediction",
    choiceId: "maps-to-6v"
  });

  assert.equal(update.state.beatId, "verify-the-multiple");
  assert.deepEqual(update.effects.map(({ type }) => type), [
    "announce",
    "transition"
  ]);
});

test("scalar input derives state and brings the manipulation into focus", () => {
  const state = createKpEigenvectorExperienceState("verify-the-multiple");
  const update = updateKpEigenvectorExperience(state, {
    type: "set-scalar",
    coefficient: -1.5
  });

  assert.equal(update.state.beatId, "reveal-the-eigenspace");
  assert.equal(update.state.scalar.coefficient, -1.5);
  assert.deepEqual(update.state.scalar.output, [-4.5, -4.5]);
  assert.deepEqual(update.effects.map(({ type }) => type), [
    "transition",
    "announce"
  ]);
});

test("boundary navigation and repeated selections are no-ops", () => {
  const first = createKpEigenvectorExperienceState();
  const previous = updateKpEigenvectorExperience(first, {
    type: "move",
    direction: "previous"
  });
  const repeated = updateKpEigenvectorExperience(first, {
    type: "select-beat",
    beatId: "most-vectors-turn"
  });

  assert.equal(previous.state, first);
  assert.deepEqual(previous.effects, []);
  assert.equal(repeated.state, first);
  assert.deepEqual(repeated.effects, []);
});
