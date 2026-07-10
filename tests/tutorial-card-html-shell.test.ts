import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardSample } from "../src/tutorial/linear-solve-card-sample.ts";
import { renderKpTutorialCardHtmlShell } from "../src/tutorial/card-html-shell.ts";

test("tutorial card HTML shell renders synchronized panel slots", () => {
  const sample = createLinearSolveTutorialCardSample();
  const html = renderKpTutorialCardHtmlShell(sample, sample.sample(0.5));

  assert.match(html, /data-kp-tutorial-card="tutorial\.linear-solve\.card\.live-sample"/);
  assert.match(html, /data-kp-tutorial-manifest="tutorial\.linear-solve\.card"/);
  assert.match(html, /data-kp-tutorial-progress="0\.5"/);
  assert.match(html, /data-kp-tutorial-clock="timeline\.linear-solve\.shared"/);
  assert.match(html, /data-kp-tutorial-panel="equation"/);
  assert.match(html, /data-kp-tutorial-panel-id="panel\.linear-solve\.equation"/);
  assert.match(html, /data-kp-tutorial-equation-animation="linear-equation-solve-x"/);
  assert.match(html, /data-kp-tutorial-equation-transition-index="1"/);
  assert.match(html, /data-kp-tutorial-equation-progress="0\.5"/);
  assert.match(html, /data-kp-tutorial-equation-token-count="\d+"/);
  assert.match(html, /data-kp-tutorial-equation-frame/);
  assert.match(html, /data-kp-tutorial-panel="graph"/);
  assert.match(html, /data-kp-tutorial-panel-id="panel\.linear-solve\.graph"/);
  assert.match(html, /data-kp-tutorial-graph-id="saddle-orbit-graph"/);
  assert.match(html, /data-kp-tutorial-controls/);
});

test("tutorial card HTML shell escapes labels and includes diagnostics state", () => {
  const sample = createLinearSolveTutorialCardSample();
  const html = renderKpTutorialCardHtmlShell(sample, sample.sample(0));

  assert.match(html, /data-kp-tutorial-diagnostics="0"/);
  assert.doesNotMatch(html, /undefined/);
});
