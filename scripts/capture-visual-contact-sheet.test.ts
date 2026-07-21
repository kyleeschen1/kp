import assert from "node:assert/strict";
import test from "node:test";

import {
  buildKpVisualContactSheetHtml,
  kpSolveXContactSheetCheckpoints
} from "./capture-visual-contact-sheet.ts";

test("canonical contact-sheet checkpoints have fixed unique ordering", () => {
  assert.deepEqual(
    kpSolveXContactSheetCheckpoints.map((checkpoint) => checkpoint.id),
    [
      "read-equality",
      "subtract-settled",
      "cancel-motion",
      "cancel-settled",
      "solution-settled",
      "cancel-motion-phone"
    ]
  );
  assert.equal(new Set(kpSolveXContactSheetCheckpoints.map((checkpoint) => checkpoint.id)).size, 6);
});

test("contact-sheet HTML is deterministic and escapes review labels", () => {
  const item = {
    id: "one",
    label: "A < B & C",
    progress: 500,
    viewport: { width: 1280, height: 900 },
    file: "one.png",
    dataUrl: "data:image/png;base64,abc"
  };
  const first = buildKpVisualContactSheetHtml([item]);
  const second = buildKpVisualContactSheetHtml([item]);
  assert.equal(first, second);
  assert.match(first, /A &lt; B &amp; C/);
  assert.match(first, /data:image\/png;base64,abc/);
  assert.doesNotMatch(first, /capturedAt|Date\(/);
});
