import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpTypeScriptRefactorMotionFrame
} from "../src/animation/typescript-refactor-motion-frame.ts";
import { createKpTypeScriptRefactorScore } from
  "../src/semantic/typescript-refactor-score.ts";

const score = createKpTypeScriptRefactorScore();

test("motion samples reversible source-projection handoffs from the shared score", () => {
  const samples = [0, 0.2, 0.3, 0.34, 0.5, 0.84, 1];
  const forward = samples.map((progress) =>
    sampleKpTypeScriptRefactorMotionFrame({ score, progress })
  );
  const rewind = [...samples].reverse().map((progress) =>
    sampleKpTypeScriptRefactorMotionFrame({ score, progress })
  ).reverse();

  assert.deepEqual(rewind, forward);
  assert.deepEqual(visibleProjectionIds(forward[0]!), ["projection.typescript.before"]);
  assert.deepEqual(visibleProjectionIds(forward.at(-1)!), ["projection.typescript.final"]);
  forward.forEach(({ projections }) => {
    assert.equal(
      Math.round(projections.reduce((sum, { opacity }) => sum + opacity, 0) * 10000) / 10000,
      1
    );
  });
});

test("helper projection settles before either call replacement stage", () => {
  const helper = sampleKpTypeScriptRefactorMotionFrame({ score, progress: 0.34 });
  const costCall = sampleKpTypeScriptRefactorMotionFrame({ score, progress: 0.68 });
  const messageCall = sampleKpTypeScriptRefactorMotionFrame({ score, progress: 0.84 });

  assert.equal(helper.stage.stageId, "stage.introduce-helper");
  assert.deepEqual(visibleProjectionIds(helper), ["projection.typescript.helper-introduced"]);
  assert.deepEqual(visibleProjectionIds(costCall), ["projection.typescript.cost-replaced"]);
  assert.deepEqual(visibleProjectionIds(messageCall), ["projection.typescript.final"]);
  assert.deepEqual(costCall.stage.focusSelectorIds, [
    "selector.typescript.call.shipping-cost.after"
  ]);
  assert.deepEqual(messageCall.stage.focusSelectorIds, [
    "selector.typescript.call.shipping-message.after"
  ]);
});

test("reduced motion resolves directly to semantic endpoints", () => {
  const before = sampleKpTypeScriptRefactorMotionFrame({
    score,
    progress: 0.2,
    reducedMotion: true
  });
  const after = sampleKpTypeScriptRefactorMotionFrame({
    score,
    progress: 0.5,
    reducedMotion: true
  });

  assert.deepEqual(
    [visibleProjectionIds(before), before.focusStrength],
    [["projection.typescript.before"], 1]
  );
  assert.deepEqual(
    [visibleProjectionIds(after), after.focusStrength],
    [["projection.typescript.helper-introduced"], 1]
  );
});

function visibleProjectionIds(
  frame: ReturnType<typeof sampleKpTypeScriptRefactorMotionFrame>
): string[] {
  return frame.projections.filter(({ opacity }) => opacity > 0).map(({ id }) => id);
}
