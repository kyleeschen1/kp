import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createAdditionProgrammingTutorialCardSample,
  renderKpProgrammingTutorialCardHtmlShell
} from "../src/tutorial/programming-card-sample.ts";

test("programming tutorial card sample synchronizes SourceFile frames", () => {
  const sample = createAdditionProgrammingTutorialCardSample();
  const frame = sample.sample(0.5);
  const rewindFrame = sample.sample(0.5);

  assert.deepEqual(frame, rewindFrame);
  assert.equal(sample.id, "tutorial.programming.add.card.live-sample");
  assert.equal(sample.manifestId, "tutorial.programming.add.card");
  assert.equal(frame.progress, 0.5);
  assert.equal(frame.sourceFrame.panelId, "panel.programming.add.code");
  assert.equal(frame.sourceFrame.sharedClockId, "clock.programming.add-demo");
  assert.deepEqual(frame.sourceFrame.selectors.map((selector) => [
    selector.selectorId,
    selector.text
  ]), [
    [
      "selector.programming.add.signature",
      "export function add(a: number, b: number) {"
    ],
    ["selector.programming.add.return", "return a + b;"]
  ]);
  assert.deepEqual(frame.diagnostics, []);
});

test("programming tutorial card sample clamps and renders a full card shell", () => {
  const sample = createAdditionProgrammingTutorialCardSample();
  const startFrame = sample.sample(Number.NaN);
  const endFrame = sample.sample(2);
  const html = renderKpProgrammingTutorialCardHtmlShell(
    sample,
    sample.sample(0.25)
  );

  assert.equal(startFrame.progress, 0);
  assert.equal(startFrame.sourceFrame.progress, 0);
  assert.equal(endFrame.progress, 1);
  assert.equal(endFrame.sourceFrame.progress, 1);
  assert.match(
    html,
    /data-kp-tutorial-card="tutorial\.programming\.add\.card\.live-sample"/
  );
  assert.match(
    html,
    /data-kp-tutorial-manifest="tutorial\.programming\.add\.card"/
  );
  assert.match(html, /data-kp-tutorial-clock="clock\.programming\.add-demo"/);
  assert.match(html, /data-kp-tutorial-progress="0\.25"/);
  assert.match(html, /data-kp-tutorial-panel="code"/);
  assert.match(html, /data-kp-tutorial-source-file="source-file\.programming\.add"/);
  assert.match(html, /data-kp-tutorial-source-selector-count="2"/);
  assert.match(html, /export function add/);
});
