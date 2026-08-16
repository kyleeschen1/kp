import assert from "node:assert/strict";
import test from "node:test";

import {
  encodeKpEditorHtmlAttribute,
  encodeKpEditorHtmlText
} from "../src/editor/html-output-encoding.ts";
import {
  encodeKpHtmlAttribute,
  encodeKpHtmlText
} from "../src/rendering/html-output-encoding.ts";

const adversarialValues = [
  `A&B < C > D "quoted" 'apostrophe'`,
  `<script>alert("not markup")</script>`,
  `already &amp; encoded`,
  `emoji 🧠 and mathematics λ→∀`,
  "",
  `"'&<>`
] as const;

test("neutral HTML text encoding closes only text-parser delimiters", () => {
  assert.equal(
    encodeKpHtmlText(`A&B < C > D "quoted" 'apostrophe'`),
    `A&amp;B &lt; C &gt; D "quoted" 'apostrophe'`
  );
});

test("neutral HTML attribute encoding also closes the double-quote delimiter", () => {
  assert.equal(
    encodeKpHtmlAttribute(`A&B < C > D "quoted" 'apostrophe'`),
    `A&amp;B &lt; C &gt; D &quot;quoted&quot; 'apostrophe'`
  );
});

test("neutral output encoding preserves the existing editor contract byte for byte", () => {
  for (const value of adversarialValues) {
    assert.equal(encodeKpHtmlText(value), encodeKpEditorHtmlText(value));
    assert.equal(
      encodeKpHtmlAttribute(value),
      encodeKpEditorHtmlAttribute(value)
    );
  }
});
