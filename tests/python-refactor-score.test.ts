import assert from "node:assert/strict";
import test from "node:test";

import { validateKpTimelineSpec } from "../src/semantic/asset-timeline.ts";
import { kpPythonFreeShippingRefactorContract } from
  "../src/semantic/python-free-shipping-refactor-contract.ts";
import {
  createKpPythonRefactorScore,
  sampleKpPythonRefactorScore
} from "../src/semantic/python-refactor-score.ts";

test("Python score follows authored pedagogy rather than AST order", () => {
  const score = createKpPythonRefactorScore();

  assert.deepEqual(validateKpTimelineSpec(score.timeline), []);
  assert.deepEqual(score.stages.map(({ id, checkpointMs, focusSelectorIds }) => ({
    id,
    checkpointMs,
    focusSelectorIds
  })), kpPythonFreeShippingRefactorContract.stages.map((stage) => ({
    id: stage.id,
    checkpointMs: stage.progress * score.durationMs,
    focusSelectorIds: stage.focusEntityIds.map((id) => `selector.python.${id}`)
  })));
  assert.ok(
    score.stages.findIndex(({ id }) => id === "stage.replace-cost-call") <
      score.stages.findIndex(({ id }) => id === "stage.replace-message-call")
  );
});

test("Python score covers one calm continuous timeline", () => {
  const score = createKpPythonRefactorScore();

  assert.equal(score.durationMs, 14000);
  assert.equal(score.stages[0]?.startMs, 0);
  assert.equal(score.stages.at(-1)?.endMs, score.durationMs);
  score.stages.slice(1).forEach((stage, index) => {
    assert.equal(stage.startMs, score.stages[index]?.endMs);
  });
  score.stages.forEach((stage) => {
    assert.equal(sampleKpPythonRefactorScore(score, stage.checkpointMs).stageId, stage.id);
  });
});

test("Python score direct seek and rewind are deterministic", () => {
  const score = createKpPythonRefactorScore();
  const points = [0, 1120, 3500, 7000, 10640, 14000];
  const forward = points.map((timeMs) => sampleKpPythonRefactorScore(score, timeMs));
  const rewind = [...points].reverse()
    .map((timeMs) => sampleKpPythonRefactorScore(score, timeMs)).reverse();

  assert.deepEqual(rewind, forward);
  assert.deepEqual(sampleKpPythonRefactorScore(score, -1), forward[0]);
  assert.deepEqual(sampleKpPythonRefactorScore(score, 99999), forward.at(-1));
  assert.doesNotMatch(JSON.stringify(score), /\b(?:x|y|width|height|bbox|glyph)\b/i);
});
