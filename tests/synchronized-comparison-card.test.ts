import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createLinearSolveProgrammingComparisonSample,
  renderKpSynchronizedComparisonHtmlShell
} from "../src/tutorial/synchronized-comparison-card.ts";

test("synchronized comparison sample drives both cards from one progress", () => {
  const sample = createLinearSolveProgrammingComparisonSample();
  const frame = sample.sample(0.5);

  assert.equal(sample.id, "comparison.linear-solve.programming-trace");
  assert.equal(frame.progress, 0.5);
  assert.equal(frame.leftFrame.progress, 0.5);
  assert.equal(frame.rightFrame.progress, 0.5);
  assert.deepEqual(sample.sample(0.5), frame);
});

test("synchronized comparison sample clamps and renders both card shells", () => {
  const sample = createLinearSolveProgrammingComparisonSample();

  assert.equal(sample.sample(Number.NaN).progress, 0);
  assert.equal(sample.sample(2).progress, 1);

  const html = renderKpSynchronizedComparisonHtmlShell(sample, sample.sample(1));

  assert.match(
    html,
    /data-kp-synchronized-comparison="comparison\.linear-solve\.programming-trace"/
  );
  assert.match(
    html,
    /data-kp-comparison-left-card="tutorial\.linear-solve\.card\.live-sample"/
  );
  assert.match(
    html,
    /data-kp-comparison-right-card="tutorial\.programming\.add\.execution-trace\.card\.live-sample"/
  );
  assert.match(html, /data-kp-tutorial-panel="equation"/);
  assert.match(html, /data-kp-tutorial-panel="execution-trace"/);
});
