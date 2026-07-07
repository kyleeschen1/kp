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
  assert.match(fragment, /class="katex/);
});

test("compileHtmlDocument wraps rendered HTML as a standalone asset", () => {
  const html = compileHtmlDocument(createInitialEditorDocument());

  assert.match(html, /^<!doctype html>/);
  assert.match(html, /<title>Identity Matrix<\/title>/);
  assert.match(html, /data-kp-document="identity-matrix-demo"/);
});
