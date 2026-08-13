import assert from "node:assert/strict";
import test from "node:test";

import { kpTypeScriptFreeShippingRefactorContract } from "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import {
  createKpTypeScriptRefactorScore,
  sampleKpTypeScriptRefactorScore
} from "../src/semantic/typescript-refactor-score.ts";
import { validateKpTimelineSpec } from "../src/semantic/asset-timeline.ts";

test("pedagogical score follows the frozen authored stage order", () => {
  const score = createKpTypeScriptRefactorScore();

  assert.deepEqual(validateKpTimelineSpec(score.timeline), []);
  assert.deepEqual(
    score.stages.map(({ id, checkpointMs, narration, focusSelectorIds }) => ({
      id,
      checkpointMs,
      narration,
      focusSelectorIds
    })),
    kpTypeScriptFreeShippingRefactorContract.stages.map((stage) => ({
      id: stage.id,
      checkpointMs: stage.progress * score.durationMs,
      narration: stage.narration,
      focusSelectorIds: stage.focusEntityIds.map((id) => `selector.typescript.${id}`)
    }))
  );
});

test("score beats cover the full timeline without gaps or overlaps", () => {
  const score = createKpTypeScriptRefactorScore();

  assert.equal(score.stages[0]?.startMs, 0);
  assert.equal(score.stages.at(-1)?.endMs, score.durationMs);
  score.stages.slice(1).forEach((stage, index) => {
    assert.equal(stage.startMs, score.stages[index]?.endMs);
  });
  score.stages.forEach((stage) => {
    assert.equal(
      sampleKpTypeScriptRefactorScore(score, stage.checkpointMs).stageId,
      stage.id
    );
  });
});

test("direct seek and rewind reproduce the same semantic score state", () => {
  const score = createKpTypeScriptRefactorScore();
  const samples = [0, 1120, 3500, 7000, 10640, 14000];
  const forward = samples.map((timeMs) => sampleKpTypeScriptRefactorScore(score, timeMs));
  const backward = [...samples].reverse()
    .map((timeMs) => sampleKpTypeScriptRefactorScore(score, timeMs))
    .reverse();
  const direct = samples.map((timeMs) => sampleKpTypeScriptRefactorScore(score, timeMs));

  assert.deepEqual(backward, forward);
  assert.deepEqual(direct, forward);
  assert.deepEqual(sampleKpTypeScriptRefactorScore(score, -100), forward[0]);
  assert.deepEqual(sampleKpTypeScriptRefactorScore(score, 99999), forward.at(-1));
});

test("score is serializable and contains no renderer geometry", () => {
  const score = createKpTypeScriptRefactorScore();
  const serialized = JSON.stringify(score);

  assert.deepEqual(JSON.parse(serialized), score);
  assert.doesNotMatch(serialized, /\b(?:x|y|width|height|bbox|glyph|clientRect)\b/i);
});
