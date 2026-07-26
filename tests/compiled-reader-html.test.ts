import assert from "node:assert/strict";
import test from "node:test";

import {
  compactKpCompiledReaderHtml
} from "../src/reader/compiler/compiled-reader-html.ts";

test("compiled reader HTML compaction removes only inter-tag formatting", () => {
  const source = `
    <main>
      <p>Keep <strong>semantic</strong> spacing &amp; text.</p>
      <script type="module" crossorigin src="/assets/reader.js"></script>
      <script type="application/json">{"label":"a > b"}</script>
    </main>
  `;
  assert.equal(
    compactKpCompiledReaderHtml(source),
    '<main><p>Keep <strong>semantic</strong> spacing &amp; text.</p>' +
      '<script type=module src="/assets/reader.js"></script>' +
      '<script type="application/json">{"label":"a > b"}</script></main>'
  );
});

test("compiled reader HTML compaction removes only terminal style semicolons", () => {
  assert.equal(
    compactKpCompiledReaderHtml(
      '<span style="height:1em;vertical-align:-0.2em;"></span>'
    ),
    '<span style="height:1em;vertical-align:-0.2em"></span>'
  );
});
