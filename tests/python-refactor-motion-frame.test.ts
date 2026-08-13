import assert from "node:assert/strict";
import test from "node:test";

import { sampleKpPythonRefactorMotionFrame } from
  "../src/animation/python-refactor-motion-frame.ts";
import { createKpPythonRefactorScore } from
  "../src/semantic/python-refactor-score.ts";

const score = createKpPythonRefactorScore();

test("Python motion samples reversible native-source handoffs", () => {
  const points = [0, 0.2, 0.3, 0.34, 0.5, 0.68, 0.84, 1];
  const forward = points.map((progress) =>
    sampleKpPythonRefactorMotionFrame({ score, progress })
  );
  const rewind = [...points].reverse().map((progress) =>
    sampleKpPythonRefactorMotionFrame({ score, progress })
  ).reverse();

  assert.deepEqual(rewind, forward);
  assert.deepEqual(visibleProjectionIds(forward[0]!), ["projection.python.before"]);
  assert.deepEqual(visibleProjectionIds(forward.at(-1)!), ["projection.python.final"]);
  forward.forEach(({ projections }) => {
    assert.equal(
      Math.round(projections.reduce((sum, { opacity }) => sum + opacity, 0) * 10000) / 10000,
      1
    );
  });
});

test("Python projection checkpoints follow the authored refactor order", () => {
  const helper = sampleKpPythonRefactorMotionFrame({ score, progress: 0.34 });
  const costCall = sampleKpPythonRefactorMotionFrame({ score, progress: 0.68 });
  const messageCall = sampleKpPythonRefactorMotionFrame({ score, progress: 0.84 });

  assert.equal(helper.stage.stageId, "stage.introduce-helper");
  assert.deepEqual(visibleProjectionIds(helper), ["projection.python.helper-introduced"]);
  assert.deepEqual(visibleProjectionIds(costCall), ["projection.python.cost-replaced"]);
  assert.deepEqual(visibleProjectionIds(messageCall), ["projection.python.final"]);
  assert.deepEqual(costCall.stage.focusSelectorIds, [
    "selector.python.call.shipping-cost.after"
  ]);
  assert.deepEqual(messageCall.stage.focusSelectorIds, [
    "selector.python.call.shipping-message.after"
  ]);
});

test("Python reduced motion jumps directly between semantic endpoints", () => {
  const before = sampleKpPythonRefactorMotionFrame({
    score,
    progress: 0.2,
    reducedMotion: true
  });
  const after = sampleKpPythonRefactorMotionFrame({
    score,
    progress: 0.5,
    reducedMotion: true
  });

  assert.deepEqual(
    [visibleProjectionIds(before), before.focusStrength],
    [["projection.python.before"], 1]
  );
  assert.deepEqual(
    [visibleProjectionIds(after), after.focusStrength],
    [["projection.python.helper-introduced"], 1]
  );
});

function visibleProjectionIds(
  frame: ReturnType<typeof sampleKpPythonRefactorMotionFrame>
): string[] {
  return frame.projections.filter(({ opacity }) => opacity > 0).map(({ id }) => id);
}
