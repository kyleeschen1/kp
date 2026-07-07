import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createInitialEditorDocument,
  renderEditorDocument
} from "../src/editor/editor.ts";
import { createEditorState } from "../src/editor/state.ts";

test("initial editor document contains a 3x3 identity matrix", () => {
  const document = createInitialEditorDocument();

  assert.deepEqual(document.objects[0], {
    id: "identity-3x3",
    type: "matrix",
    label: "I_3",
    rows: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ]
  });
});

test("renderEditorDocument renders the identity matrix with KaTeX and JSON", () => {
  const html = renderEditorDocument(createInitialEditorDocument());

  assert.match(html, /data-kp-object="identity-3x3"/);
  assert.match(html, /class="katex/);
  assert.match(html, /&quot;type&quot;: &quot;matrix&quot;/);
});

test("createEditorState stores the current semantic document", () => {
  const document = createInitialEditorDocument();
  const state = createEditorState(document);

  assert.equal(state.document, document);
  assert.equal(state.selectedObjectId, "identity-3x3");
});
