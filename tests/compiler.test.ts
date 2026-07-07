import { strict as assert } from "node:assert";
import test from "node:test";

import {
  compileHtmlDocument,
  compileHtmlFragment
} from "../src/compiler/html-asset.ts";
import { createInitialEditorDocument } from "../src/editor/editor.ts";

test("compileHtmlFragment compiles semantic JSON into rendered HTML", () => {
  const fragment = compileHtmlFragment(createInitialEditorDocument());

  assert.match(fragment, /data-kp-object="identity-3x3"/);
  assert.match(fragment, /data-kp-object="parabola-graph"/);
  assert.match(fragment, /data-kp-object="curve-y-equals-x-squared"/);
  assert.match(fragment, /data-kp-object="saddle-orbit-graph"/);
  assert.match(fragment, /data-kp-object="saddle-surface"/);
  assert.match(fragment, /data-kp-object="time-spiral-curve"/);
  assert.match(fragment, /class="graph-surface__quad"/);
  assert.match(fragment, /class="katex/);
  assert.match(fragment, /class="graph-svg"/);
});

test("compileHtmlDocument wraps rendered HTML as a standalone asset", () => {
  const html = compileHtmlDocument(createInitialEditorDocument());

  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<title>Identity Matrix<\/title>/);
  assert.match(html, /data-kp-document="identity-matrix-demo"/);
  assert.match(html, /data-kp-render-node="rn-curve-y-equals-x-squared-svg-path"/);
  assert.match(html, /data-kp-render-node="rn-saddle-surface-svg-quads"/);
  assert.match(html, /data-kp-render-node="rn-saddle-surface-svg-wireframe"/);
  assert.match(html, /data-kp-render-node="rn-time-spiral-curve-svg-path"/);
});
