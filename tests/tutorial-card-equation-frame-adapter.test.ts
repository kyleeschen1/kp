import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialEquationFrameAdapter } from "../src/tutorial/equation-frame-adapter.ts";

test("tutorial equation frame adapter resolves active equation transition from card progress", () => {
  const adapter = createKpTutorialEquationFrameAdapter(
    createLinearSolveTutorialCardFrameSampler()
  );
  const frame = adapter.sample(0.5);
  const rewindFrame = adapter.sample(0.5);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(adapter.panelId, "panel.linear-solve.equation");
  assert.equal(adapter.animationId, "linear-equation-solve-x");
  assert.equal(frame.cardProgress, 0.5);
  assert.equal(frame.transitionIndex, 1);
  assert.equal(frame.transitionTrackId, "timeline.linear-solve.shared.transformation.transform.linear-solve.cancel-left-additive-inverse");
  assert.equal(frame.transitionProgress, 0.5);
  assert.equal(frame.equationFrame.progress, 0.5);
  assert.ok(frame.equationFrame.tokens.some((token) => token.tokenId === "lhs.x"));
});

test("tutorial equation frame adapter clamps through parent timeline", () => {
  const adapter = createKpTutorialEquationFrameAdapter(
    createLinearSolveTutorialCardFrameSampler()
  );
  const startFrame = adapter.sample(Number.NaN);
  const endFrame = adapter.sample(2);

  assert.equal(startFrame.cardProgress, 0);
  assert.equal(startFrame.transitionIndex, 0);
  assert.equal(startFrame.transitionProgress, 0);
  assert.equal(endFrame.cardProgress, 1);
  assert.equal(endFrame.transitionIndex, 2);
  assert.equal(endFrame.transitionProgress, 1);
});
