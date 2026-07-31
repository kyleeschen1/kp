import assert from "node:assert/strict";
import test from "node:test";

import {
  encodeKpEditorHtmlAttribute,
  encodeKpEditorHtmlText
} from "../src/editor/html-output-encoding.ts";

test("editor HTML text encoding preserves quotes outside parser delimiters", () => {
  assert.equal(
    encodeKpEditorHtmlText(`A&B < C > D "quoted" 'apostrophe'`),
    `A&amp;B &lt; C &gt; D "quoted" 'apostrophe'`
  );
});

test("editor HTML attribute encoding closes the double-quote delimiter", () => {
  assert.equal(
    encodeKpEditorHtmlAttribute(`A&B < C > D "quoted" 'apostrophe'`),
    `A&amp;B &lt; C &gt; D &quot;quoted&quot; 'apostrophe'`
  );
});
