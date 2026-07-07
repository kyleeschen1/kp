import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createInitialEditorDocument,
  renderEditorDocument
} from "../src/editor/editor.ts";
import { compileDocumentAsset } from "../src/editor/compile-client.ts";
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
  assert.deepEqual(
    document.objects.slice(1).map((object) => object.type),
    [
      "graph-2d",
      "axis-2d",
      "axis-2d",
      "curve-2d",
      "graph-3d",
      "axis-3d",
      "axis-3d",
      "axis-3d",
      "surface-3d",
      "curve-3d"
    ]
  );
  assert.equal(document.objects[1]?.id, "parabola-graph");
  assert.equal(document.objects[4]?.id, "curve-y-equals-x-squared");
  assert.equal(document.objects[5]?.id, "saddle-orbit-graph");
  assert.equal(document.objects[9]?.id, "saddle-surface");
  assert.equal(document.objects[10]?.id, "time-spiral-curve");
});

test("renderEditorDocument renders the identity matrix with KaTeX and JSON", () => {
  const html = renderEditorDocument(createInitialEditorDocument());

  assert.match(html, /data-kp-object="identity-3x3"/);
  assert.match(html, /data-kp-render-node="rn-identity-3x3-default-latex"/);
  assert.match(html, /data-kp-object="parabola-graph"/);
  assert.match(html, /data-kp-object="parabola-x-axis"/);
  assert.match(html, /data-kp-object="parabola-y-axis"/);
  assert.match(html, /data-kp-object="curve-y-equals-x-squared"/);
  assert.match(html, /data-kp-object="saddle-orbit-graph"/);
  assert.match(html, /data-kp-object="saddle-orbit-x-axis"/);
  assert.match(html, /data-kp-object="saddle-orbit-y-axis"/);
  assert.match(html, /data-kp-object="saddle-orbit-z-axis"/);
  assert.match(html, /data-kp-object="saddle-surface"/);
  assert.match(html, /data-kp-object="time-spiral-curve"/);
  assert.match(html, /class="katex/);
  assert.match(html, /class="graph-svg"/);
  assert.match(html, /&quot;type&quot;: &quot;matrix&quot;/);
  assert.match(html, /&quot;type&quot;: &quot;graph-2d&quot;/);
  assert.match(html, /&quot;type&quot;: &quot;graph-3d&quot;/);
  assert.match(html, /data-action="compile-document"/);
  assert.match(html, /id="compiled-source"/);
  assert.match(html, /No validation issues/);
  assert.ok(
    html.indexOf('data-kp-object="identity-3x3"') <
      html.indexOf('data-kp-object="parabola-graph"')
  );
  assert.ok(
    html.indexOf('data-kp-object="parabola-graph"') <
      html.indexOf('data-kp-object="saddle-orbit-graph"')
  );
});

test("createEditorState stores the current semantic document", () => {
  const document = createInitialEditorDocument();
  const state = createEditorState(document);

  assert.equal(state.document, document);
  assert.equal(state.selectedObjectId, "identity-3x3");
});

test("compileDocumentAsset posts the semantic document and returns HTML", async () => {
  const document = createInitialEditorDocument();
  const html = await compileDocumentAsset(document, async (input, init) => {
    assert.equal(input, "/api/compile");
    assert.equal(init?.method, "POST");
    assert.equal(init?.body, JSON.stringify(document));

    return new Response("<!doctype html><html></html>", {
      headers: {
        "content-type": "text/html"
      },
      status: 200
    });
  });

  assert.equal(html, "<!doctype html><html></html>");
});
