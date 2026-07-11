import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createSourceFileObject,
  createSourceRangeSelector
} from "../src/semantic/source-file.ts";
import { createLinearSolveTutorialCardSample } from "../src/tutorial/linear-solve-card-sample.ts";
import {
  renderKpTutorialCardHtmlShell,
  renderKpTutorialSourceFilePanelHtml
} from "../src/tutorial/card-html-shell.ts";
import { createKpTutorialProgrammingPanelContract } from "../src/tutorial/programming-panel.ts";
import { createKpTutorialSourceFileFrameAdapter } from "../src/tutorial/source-file-frame-adapter.ts";

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
  assert.match(html, /data-kp-tutorial-graph-progress="0\.5"/);
  assert.match(html, /data-kp-tutorial-graph-channel-count="1"/);
  assert.match(html, /data-kp-tutorial-graph-vertex-count="441"/);
  assert.match(html, /data-kp-tutorial-graph-frame/);
  assert.match(html, /data-kp-tutorial-controls/);
  assert.match(html, /data-kp-tutorial-control-id="control\.linear-solve\.scrubber"/);
  assert.match(html, /data-kp-tutorial-control-kind="scrubber"/);
  assert.match(html, /data-kp-tutorial-control-progress="0\.5"/);
  assert.match(html, /data-kp-tutorial-control-beat="25"/);
});

test("tutorial card HTML shell escapes labels and includes diagnostics state", () => {
  const sample = createLinearSolveTutorialCardSample();
  const html = renderKpTutorialCardHtmlShell(sample, sample.sample(0));

  assert.match(html, /data-kp-tutorial-diagnostics="0"/);
  assert.doesNotMatch(html, /undefined/);
});

test("tutorial card HTML shell renders a static SourceFile programming panel", () => {
  const sourceFile = createSourceFileObject({
    id: "source-file.add",
    label: "add.ts",
    language: "typescript",
    sourceText: "export function add(a: number, b: number) {\n  return a + b;\n}"
  });
  const selectors = [
    createSourceRangeSelector({
      id: "selector.add.signature",
      sourceFileId: sourceFile.id,
      start: { line: 1, column: 1 },
      end: { line: 1, column: 44 },
      summary: "Function signature."
    })
  ];
  const panel = createKpTutorialProgrammingPanelContract({
    panelId: "panel.add.code",
    sharedClockId: "clock.add-demo",
    sourceFile,
    selectors
  });
  const adapter = createKpTutorialSourceFileFrameAdapter({
    panel,
    sourceFile,
    selectors
  });
  const html = renderKpTutorialSourceFilePanelHtml(adapter.sample(0.25));

  assert.match(html, /data-kp-tutorial-panel="code"/);
  assert.match(html, /data-kp-tutorial-panel-id="panel\.add\.code"/);
  assert.match(html, /data-kp-tutorial-source-file="source-file\.add"/);
  assert.match(html, /data-kp-tutorial-source-language="typescript"/);
  assert.match(html, /data-kp-tutorial-source-progress="0\.25"/);
  assert.match(html, /data-kp-tutorial-source-line-count="3"/);
  assert.match(html, /data-kp-tutorial-source-selector-count="1"/);
  assert.match(html, /data-kp-tutorial-source-file-frame/);
  assert.match(html, /data-kp-tutorial-source-line="1"/);
  assert.match(html, /export function add/);
  assert.match(
    html,
    /data-kp-tutorial-source-selector="selector\.add\.signature"/
  );
  assert.match(html, /data-kp-tutorial-source-start-offset="0"/);
  assert.match(html, /data-kp-tutorial-source-end-offset="43"/);
  assert.match(html, /Function signature\./);
});
