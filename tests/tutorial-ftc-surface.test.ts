import assert from "node:assert/strict";
import test from "node:test";
import { renderKpFtcTutorialEditorSurface } from "../src/editor/ftc-tutorial-editor-surface.ts";
import { renderKpFtcTutorialSurface } from "../src/tutorial/ftc-surface.ts";

test("FTC learner surface renders stable SVG, KaTeX, full motion, and no scroll containers", () => {
  const html = renderKpFtcTutorialSurface({ progress: 0.5 });

  assert.match(html, /data-kp-ftc-tutorial-host/);
  assert.match(html, /data-kp-motion-profile="full"/);
  assert.match(html, /data-kp-ftc-graph/);
  assert.match(html, /data-kp-selector="ftc\.graph\.integrand-curve"/);
  assert.match(html, /class="katex"/);
  assert.match(html, /data-kp-ftc-epistemic-probe/);
  assert.doesNotMatch(html, /overflow:\s*(auto|scroll)/);
});

test("FTC editor surface embeds the learner surface and semantic inspector", () => {
  const html = renderKpFtcTutorialEditorSurface();

  assert.match(html, /data-kp-ftc-editor-surface/);
  assert.match(html, /data-kp-ftc-tutorial-host/);
  assert.match(html, /data-kp-tutorial-inspector=/);
  assert.match(html, /data-kp-artifact-maturity="reviewable"/);
  assert.match(html, /data-action="show-ftc-tutorial"/);
});
