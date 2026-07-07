import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createInitialEditorDocument,
  renderEditorDocument
} from "../src/editor/editor.ts";
import { compileDocumentAsset } from "../src/editor/compile-client.ts";
import {
  addLatexEquationGraph,
  createEditorState,
  updateGraph3DAzimuth,
  updateGraph3DOccludedAxisLightness,
  updateSaddleSurfaceDenominator
} from "../src/editor/state.ts";
import type {
  Graph2DObject,
  Graph3DObject,
  Surface3DObject
} from "../src/semantic/graph.ts";

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
      "surface-3d"
    ]
  );
  assert.equal(document.objects[1]?.id, "parabola-graph");
  assert.equal(document.objects[4]?.id, "curve-y-equals-x-squared");
  assert.equal(document.objects[5]?.id, "saddle-orbit-graph");
  assert.equal(document.objects[9]?.id, "saddle-surface");
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
  assert.doesNotMatch(html, /data-kp-object="time-spiral-curve"/);
  assert.match(html, /class="katex/);
  assert.match(html, /class="graph-svg"/);
  assert.match(html, /&quot;type&quot;: &quot;matrix&quot;/);
  assert.match(html, /&quot;type&quot;: &quot;graph-2d&quot;/);
  assert.match(html, /&quot;type&quot;: &quot;graph-3d&quot;/);
  assert.match(html, /data-role="semantic-json"/);
  assert.match(html, /data-role="equation-input"/);
  assert.match(html, /data-action="add-equation-graph"/);
  assert.match(html, /data-role="equation-error"/);
  assert.match(html, /data-action="compile-document"/);
  assert.match(html, /data-action="set-graph-azimuth"/);
  assert.match(html, /data-action="set-graph-occluded-axis-lightness"/);
  assert.match(html, /data-action="set-saddle-denominator"/);
  assert.match(html, /data-kp-graph-rotation-axis="z"/);
  assert.match(html, /data-kp-graph-color-target="occluded-axis"/);
  assert.match(html, /data-kp-graph-surface-parameter="saddle-denominator"/);
  assert.match(html, /data-graph-id="saddle-orbit-graph"/);
  assert.match(html, /data-surface-id="saddle-surface"/);
  assert.match(html, /type="range"/);
  assert.match(html, /min="-180"/);
  assert.match(html, /max="180"/);
  assert.match(html, /value="35"/);
  assert.match(html, /min="0"/);
  assert.match(html, /max="100"/);
  assert.match(html, /value="44"/);
  assert.match(html, /min="1"/);
  assert.match(html, /max="16"/);
  assert.match(html, /value="4"/);
  assert.match(html, /#5d7583/);
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

test("addLatexEquationGraph appends a generated graph scene", () => {
  const document = createInitialEditorDocument();
  const nextDocument = addLatexEquationGraph(document, "y = x^2 + 1");
  const generatedGraph = nextDocument.objects.find(
    (object): object is Graph2DObject => object.id === "equation-1-graph"
  );

  assert.notEqual(nextDocument, document);
  assert.equal(document.objects.some((object) => object.id === "equation-1-graph"), false);
  assert.equal(generatedGraph?.type, "graph-2d");
  assert.deepEqual(
    nextDocument.objects.slice(-4).map((object) => object.id),
    [
      "equation-1-graph",
      "equation-1-x-axis",
      "equation-1-y-axis",
      "equation-1-curve"
    ]
  );
});

test("createEditorState stores the current semantic document", () => {
  const document = createInitialEditorDocument();
  const state = createEditorState(document);

  assert.equal(state.document, document);
  assert.equal(state.selectedObjectId, "identity-3x3");
});

test("updateGraph3DAzimuth updates the semantic graph camera without mutating the source document", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DAzimuth(document, "saddle-orbit-graph", 92);
  const originalGraph = document.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.notEqual(nextDocument, document);
  assert.equal(originalGraph?.camera.azimuthDegrees, 35);
  assert.equal(nextGraph?.camera.azimuthDegrees, 92);
});

test("updateGraph3DOccludedAxisLightness updates the semantic graph render setting", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DOccludedAxisLightness(
    document,
    "saddle-orbit-graph",
    42
  );
  const clampedDocument = updateGraph3DOccludedAxisLightness(
    document,
    "saddle-orbit-graph",
    142
  );
  const originalGraph = document.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const clampedGraph = clampedDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.notEqual(nextDocument, document);
  assert.equal(originalGraph?.occludedAxisLightness, 44);
  assert.equal(nextGraph?.occludedAxisLightness, 42);
  assert.equal(clampedGraph?.occludedAxisLightness, 100);
});

test("updateSaddleSurfaceDenominator updates a parameterized saddle surface", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateSaddleSurfaceDenominator(
    document,
    "saddle-surface",
    8
  );
  const clampedDocument = updateSaddleSurfaceDenominator(
    document,
    "saddle-surface",
    80
  );
  const originalSurface = document.objects.find(
    (object): object is Surface3DObject => object.id === "saddle-surface"
  );
  const nextSurface = nextDocument.objects.find(
    (object): object is Surface3DObject => object.id === "saddle-surface"
  );
  const clampedSurface = clampedDocument.objects.find(
    (object): object is Surface3DObject => object.id === "saddle-surface"
  );

  assert.notEqual(nextDocument, document);
  assert.equal(originalSurface?.parameterization?.denominator, 4);
  assert.equal(nextSurface?.parameterization?.denominator, 8);
  assert.equal(nextSurface?.equation, "z = (x^2 - y^2) / 8");
  assert.equal(clampedSurface?.parameterization?.denominator, 16);
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
