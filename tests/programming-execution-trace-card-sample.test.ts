import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createAdditionProgrammingExecutionTraceTutorialCardSample,
  renderKpProgrammingExecutionTraceTutorialCardHtmlShell
} from "../src/tutorial/programming-execution-trace-card-sample.ts";

test("programming execution-trace tutorial card samples source and trace frames", () => {
  const sample = createAdditionProgrammingExecutionTraceTutorialCardSample();
  const frame = sample.sample(0.5);

  assert.equal(
    sample.id,
    "tutorial.programming.add.execution-trace.card.live-sample"
  );
  assert.equal(frame.progress, 0.5);
  assert.equal(frame.sourceFrame.progress, 0.5);
  assert.equal(
    frame.traceFrame.stepId,
    "step.programming.add.evaluate-return"
  );
  assert.equal(frame.sourceFrame.sharedClockId, frame.traceFrame.sharedClockId);
  assert.deepEqual(sample.sample(0.5), frame);
});

test("programming execution-trace tutorial card clamps and renders html shell", () => {
  const sample = createAdditionProgrammingExecutionTraceTutorialCardSample();

  assert.equal(sample.sample(Number.NaN).progress, 0);
  assert.equal(sample.sample(2).progress, 1);

  const html = renderKpProgrammingExecutionTraceTutorialCardHtmlShell(
    sample,
    sample.sample(1)
  );

  assert.match(
    html,
    /data-kp-tutorial-card="tutorial\.programming\.add\.execution-trace\.card\.live-sample"/
  );
  assert.match(html, /data-kp-tutorial-panel="code"/);
  assert.match(html, /data-kp-tutorial-panel="execution-trace"/);
  assert.match(html, /data-kp-tutorial-execution-output-count="1"/);
  assert.match(html, /return a \+ b/);
});
