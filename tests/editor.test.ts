import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createInitialEditorDocument,
  renderEditorDocument
} from "../src/editor/editor.ts";
import { compileDocumentAsset } from "../src/editor/compile-client.ts";
import {
  GRAPH_3D_VIEW_MODE_IDS,
  GRAPH_3D_LIGHT_PRESETS,
  applyGraph3DLightPreset,
  addLatexEquationGraph,
  createEditorState,
  updateGraph3DAzimuth,
  updateGraph3DLightSetting,
  updateGraph3DOccludedAxisLightness,
  updateGraph3DShadowEnabled,
  updateGraph3DShadowOpacity,
  updateGraph3DSurfaceQuality,
  updateGraph3DSurfaceMode,
  updateGraph3DViewMode,
  updateSaddleSurfaceDenominator
} from "../src/editor/state.ts";
import type {
  Graph2DObject,
  Graph3DObject,
  Surface3DObject
} from "../src/semantic/graph.ts";

function extractEquationMotionStateBlock(html: string, state: number): string {
  const stateAttribute = `data-kp-equation-motion-state="${state}"`;
  const stateAttributeStart = html.indexOf(stateAttribute);
  assert.notEqual(stateAttributeStart, -1);

  const stateStart = html.lastIndexOf("<div", stateAttributeStart);
  assert.notEqual(stateStart, -1);

  const nextStateStart = html.indexOf(
    "data-kp-equation-motion-state=\"",
    stateAttributeStart + stateAttribute.length
  );

  return html.slice(
    stateStart,
    nextStateStart === -1 ? undefined : nextStateStart
  );
}

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
      "graph-3d",
      "axis-3d",
      "axis-3d",
      "axis-3d",
      "surface-3d"
    ]
  );
  assert.equal(document.objects[1]?.id, "saddle-orbit-graph");
  assert.equal(document.objects[5]?.id, "saddle-surface");
  assert.equal(document.objects.some((object) => object.id === "parabola-graph"), false);
  assert.equal(
    document.objects.some((object) => object.id === "curve-y-equals-x-squared"),
    false
  );
});

test("renderEditorDocument renders the identity matrix with KaTeX and API outline", () => {
  const html = renderEditorDocument(createInitialEditorDocument());

  assert.match(html, /data-kp-api-outline/);
  assert.match(html, /id="api-outline-title"[^>]*>API Outline</);
  assert.match(html, /data-kp-api-outline-group="semantic-objects"/);
  assert.match(html, /Semantic Objects/);
  assert.match(html, /data-kp-api-outline-item="semantic-matrix"/);
  assert.match(html, />Matrix</);
  assert.match(html, /data-kp-api-outline-item="semantic-equation"/);
  assert.match(html, />Equation</);
  assert.match(html, /data-kp-api-outline-group="semantic-transformations"/);
  assert.match(html, /Semantic Transformations/);
  assert.match(html, /data-kp-api-outline-item="transform-subtract-both-sides"/);
  assert.match(html, />subtractBothSides</);
  assert.match(html, /data-kp-api-outline-item="transform-cancel-additive-inverse"/);
  assert.match(html, />cancelAdditiveInverse</);
  assert.match(html, /data-kp-api-outline-item="transform-evaluate-constant-expression"/);
  assert.match(html, />evaluateConstantExpression</);
  assert.match(html, /data-kp-api-outline-item="transform-matrix-multiply"/);
  assert.match(html, />matrixMultiply</);
  assert.match(html, /data-kp-api-outline-item="transform-compute-jacobian"/);
  assert.match(html, />computeJacobian</);
  assert.match(html, /data-kp-api-outline-item="transform-compute-hessian"/);
  assert.match(html, />computeHessian</);
  assert.match(html, /data-kp-api-outline-item="transform-rename-variable"/);
  assert.match(html, />renameVariable</);
  assert.match(html, /data-kp-api-outline-group="notation-transformations"/);
  assert.match(html, /Notation Transformations/);
  assert.match(html, /data-kp-api-outline-item="notation-inline-to-stacked-fraction"/);
  assert.match(html, />inlineFractionToStackedFraction</);
  assert.match(html, /data-kp-api-outline-item="notation-radical-to-exponent"/);
  assert.match(html, />radicalToExponent</);
  assert.match(html, /data-kp-api-outline-item="notation-implicit-to-explicit-multiply"/);
  assert.match(html, />implicitToExplicitMultiplication</);
  assert.match(html, /data-kp-api-outline-group="motion-primitives"/);
  assert.match(html, /data-kp-api-outline-item="motion-vanish"/);
  assert.match(html, />vanish</);
  assert.match(html, /data-kp-api-outline-group="layout-objects"/);
  assert.match(html, /data-kp-api-outline-item="layout-tabs"/);
  assert.match(html, />tabs</);
  assert.match(html, /data-kp-api-outline-group="curriculum-assessment"/);
  assert.match(html, /data-kp-api-outline-item="curriculum-spaced-repetition-card"/);
  assert.match(html, />SpacedRepetitionCard</);
  assert.match(html, /data-kp-api-outline-group="embeds-export"/);
  assert.match(html, /data-kp-api-outline-item="authoring-transform-fixture-contract"/);
  assert.match(html, />TransformFixtureDocument</);
  assert.match(html, /data-kp-api-sample-card/);
  assert.match(html, /Select an API item to preview its future sample card/);
  assert.match(html, />Semantic API</);
  assert.doesNotMatch(html, />JSON to HTML</);
  assert.doesNotMatch(html, /data-role="semantic-json"/);
  assert.doesNotMatch(html, /class="json-source"/);
  assert.doesNotMatch(html, />Semantic JSON</);
  assert.match(html, /data-kp-equation-motion-demo/);
  assert.match(html, /data-kp-equation-animation-selector/);
  assert.match(
    html,
    /select[^>]*data-action="set-equation-motion-animation"[^>]*aria-label="Select equation animation"/
  );
  assert.match(
    html,
    /option value="linear-equation-solve-x" selected>x \+ 3 = 7/
  );
  assert.match(
    html,
    /option value="fixture-fraction-make-inline-to-stacked">Inline fraction to stacked/
  );
  assert.match(
    html,
    /option value="fixture-radical-rewrite-power-as-root">Power to radical/
  );
  assert.match(
    html,
    /option value="fixture-wrapper-function-wrap">Wrap with function/
  );
  assert.match(
    html,
    /option value="fixture-script-combine-factor-as-power">Repeated factor to exponent/
  );
  assert.match(
    html,
    /option value="fixture-matrix-bracket-change-delimiter">Matrix bracket swap/
  );
  assert.match(html, /data-kp-equation-motion-step="0"/);
  assert.match(html, /data-kp-equation-motion-max-step="3"/);
  assert.match(html, /data-kp-equation-motion-settings/);
  assert.match(html, /<summary>Timing controls<\/summary>/);
  assert.match(html, /data-kp-equation-motion-step-controls/);
  assert.match(html, /data-action="equation-motion-rewind"[^>]*>Back</);
  assert.match(
    html,
    /type="range"[^>]*data-action="set-equation-motion-beat"[^>]*min="0"[^>]*max="20"[^>]*step="1"[^>]*value="0"[^>]*data-kp-equation-motion-beats="20"/
  );
  assert.match(html, /data-role="equation-motion-beat-output"[^>]*>0\/20</);
  assert.match(
    html,
    /type="range"[^>]*data-action="set-equation-motion-duration"[^>]*min="200"[^>]*max="3000"[^>]*step="20"[^>]*value="420"/
  );
  assert.match(
    html,
    /data-role="equation-motion-duration-output"[^>]*>420 ms</
  );
  assert.match(
    html,
    /type="range"[^>]*data-action="set-equation-motion-collapse-scale"[^>]*min="5"[^>]*max="50"[^>]*step="1"[^>]*value="35"/
  );
  assert.match(
    html,
    /data-role="equation-motion-collapse-scale-output"[^>]*>35%</
  );
  assert.match(html, /data-action="equation-motion-next"[^>]*>Forward</);
  assert.match(html, /data-kp-motion-operator="binary"/);
  assert.match(html, /data-kp-editor-visual-tuning/);
  assert.match(html, /Visual Tuning/);
  assert.match(html, /Operator size/);
  assert.match(
    html,
    /type="range"[^>]*data-action="set-katex-operator-scale"[^>]*min="50"[^>]*max="150"[^>]*step="1"[^>]*value="85"/
  );
  assert.match(html, /data-role="katex-operator-scale-output"[^>]*>85%</);
  assert.ok(
    html.indexOf("data-kp-equation-motion-demo") <
      html.indexOf("data-kp-editor-visual-tuning"),
    "KaTeX visual tuning controls should render below the equation example"
  );
  assert.equal(
    html.match(/data-kp-equation-motion-state="/g)?.length,
    4
  );
  assert.match(html, /data-kp-equation-motion-state="0"/);
  assert.match(html, /data-kp-equation-motion-state="1"/);
  assert.match(html, /data-kp-equation-motion-state="2"/);
  assert.match(html, /data-kp-equation-motion-state="3"/);
  assert.match(
    extractEquationMotionStateBlock(html, 0),
    /equation-motion__state--active/
  );
  assert.match(
    extractEquationMotionStateBlock(html, 0),
    /data-kp-equation-motion-active="true"[^>]*aria-hidden="false"/
  );
  assert.match(
    extractEquationMotionStateBlock(html, 1),
    /data-kp-equation-motion-active="false"[^>]*aria-hidden="true"/
  );
  assert.doesNotMatch(
    extractEquationMotionStateBlock(html, 1),
    /equation-motion__state--active/
  );
  assert.match(html, /data-kp-equation-motion-latex="x \+ 3 = 7"/);
  assert.match(html, /data-kp-equation-motion-latex="x \+ 3 - 3 = 7 - 3"/);
  assert.match(html, /data-kp-equation-motion-latex="x = 7 - 3"/);
  assert.match(html, /data-kp-equation-motion-latex="x = 4"/);
  assert.match(html, /data-kp-motion-id="lhs\.x"/);
  assert.match(html, /data-kp-motion-id="lhs\.plus"/);
  assert.match(html, /data-kp-motion-id="equals"/);
  assert.match(html, /data-kp-motion-id="rhs\.7"/);
  assert.match(html, /data-kp-motion-id="rhs\.4"/);
  assert.match(extractEquationMotionStateBlock(html, 0), /data-kp-motion-id="lhs\.plus"/);
  assert.match(extractEquationMotionStateBlock(html, 3), /data-kp-motion-id="rhs\.4"/);
  assert.match(
    extractEquationMotionStateBlock(html, 0),
    /class="equation-motion__formula"[^>]*aria-label="x \+ 3 = 7"[\s\S]*data-kp-motion-id="lhs\.x"/
  );
  assert.doesNotMatch(html, /equation-motion__motion-anchors/);
  assert.doesNotMatch(
    extractEquationMotionStateBlock(html, 2),
    /data-kp-motion-id="lhs\.plus"/
  );
  assert.match(html, /data-kp-object="identity-3x3"/);
  assert.match(html, /data-kp-render-node="rn-identity-3x3-default-latex"/);
  assert.doesNotMatch(html, /data-kp-object="parabola-graph"/);
  assert.doesNotMatch(html, /data-kp-object="parabola-x-axis"/);
  assert.doesNotMatch(html, /data-kp-object="parabola-y-axis"/);
  assert.doesNotMatch(html, /data-kp-object="curve-y-equals-x-squared"/);
  assert.match(html, /data-kp-object="saddle-orbit-graph"/);
  assert.match(html, /data-kp-object="saddle-orbit-x-axis"/);
  assert.match(html, /data-kp-object="saddle-orbit-y-axis"/);
  assert.match(html, /data-kp-object="saddle-orbit-z-axis"/);
  assert.match(html, /data-kp-object="saddle-surface"/);
  assert.doesNotMatch(html, /data-kp-object="time-spiral-curve"/);
  assert.match(html, /class="katex/);
  assert.match(html, /class="graph-svg graph-svg--3d"/);
  assert.match(html, /class="graph-webgl"/);
  assert.match(html, /data-kp-renderer="webgl"/);
  assert.match(html, /data-kp-webgl-backend="three"/);
  assert.match(html, /class="graph-webgl__canvas"/);
  assert.match(html, /data-kp-renderer-fallback="svg"/);
  assert.match(html, /data-role="equation-input"/);
  assert.match(html, /data-action="add-equation-graph"/);
  assert.match(html, /data-role="equation-error"/);
  assert.match(html, /data-action="show-project-dashboard"/);
  assert.match(html, />Project Dashboard</);
  assert.match(html, /data-action="compile-document"/);
  assert.match(html, /data-action="set-graph-azimuth"/);
  assert.match(html, /data-action="set-graph-light-preset"/);
  assert.match(html, /data-action="set-graph-light-setting"/);
  assert.match(html, /data-action="set-graph-shadow-enabled"/);
  assert.match(html, /data-action="set-graph-shadow-opacity"/);
  assert.match(html, /data-action="set-graph-occluded-axis-lightness"/);
  assert.match(html, /data-action="set-graph-surface-mode"/);
  assert.match(html, /data-action="set-graph-surface-quality"/);
  assert.match(html, /data-action="set-graph-view-mode"/);
  assert.match(html, /data-action="set-saddle-denominator"/);
  assert.match(html, /class="graph-controls__foldout"[^>]*data-kp-controls-foldout="render-settings"/);
  assert.doesNotMatch(html, /class="graph-controls__foldout"[^>]*open/);
  assert.ok(
    html.indexOf('data-action="set-graph-view-mode"') <
      html.indexOf('data-kp-controls-foldout="render-settings"')
  );
  assert.ok(
    html.indexOf('data-action="set-graph-surface-mode"') <
      html.indexOf('data-kp-controls-foldout="render-settings"')
  );
  assert.match(html, /data-kp-graph-rotation-axis="z"/);
  assert.match(html, /data-kp-graph-surface-mode="mesh"/);
  assert.match(html, /data-kp-graph-surface-quality="balanced"/);
  assert.match(html, /data-kp-graph-view-mode="3d"/);
  assert.match(html, /value="xy"/);
  assert.match(html, /value="donut"/);
  assert.match(html, /value="hyperplanes"/);
  assert.match(html, /value="interactive"/);
  assert.match(html, /value="high"/);
  assert.match(html, /data-kp-graph-light-preset="studio"/);
  assert.match(html, /value="raking"/);
  assert.match(html, /value="flat"/);
  assert.match(html, /data-kp-graph-light-setting="ambient"/);
  assert.match(html, /data-kp-graph-light-setting="diffuse"/);
  assert.match(html, /data-kp-graph-light-setting="depthHaze"/);
  assert.match(html, /data-kp-graph-light-setting="specular"/);
  assert.match(html, /data-kp-graph-light-setting="rim"/);
  assert.match(html, /data-kp-graph-shadow-setting="enabled"/);
  assert.match(html, /data-kp-graph-shadow-setting="opacity"/);
  assert.match(html, /data-kp-graph-color-target="occluded-axis"/);
  assert.match(html, /data-kp-graph-surface-parameter="saddle-denominator"/);
  assert.match(html, /data-graph-id="saddle-orbit-graph"/);
  assert.match(html, /data-surface-id="saddle-surface"/);
  assert.match(html, /type="range"/);
  assert.match(html, /type="checkbox" checked/);
  assert.match(html, /min="-180"/);
  assert.match(html, /max="180"/);
  assert.match(html, /value="35"/);
  assert.match(html, /min="0"/);
  assert.match(html, /max="1"/);
  assert.match(html, /step="0.01"/);
  assert.match(html, /value="0.450"/);
  assert.match(html, /value="0.400"/);
  assert.match(html, /value="0.120"/);
  assert.match(html, /value="0.080"/);
  assert.match(html, /value="0.160"/);
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
      html.indexOf('data-kp-equation-motion-demo')
  );
  assert.ok(
    html.indexOf('data-kp-equation-motion-demo') <
      html.indexOf('data-kp-object="saddle-orbit-graph"')
  );
  assert.ok(
    html.indexOf('data-action="set-graph-azimuth"') <
      html.indexOf('data-action="set-graph-view-mode"')
  );
  assert.ok(
    html.indexOf('data-action="set-graph-surface-mode"') <
      html.indexOf('data-kp-controls-foldout="render-settings"')
  );
  assert.ok(
    html.indexOf('data-kp-controls-foldout="render-settings"') <
      html.indexOf('data-action="set-graph-surface-quality"')
  );
  assert.ok(
    html.indexOf('data-kp-controls-foldout="render-settings"') <
      html.indexOf('data-action="set-graph-light-preset"')
  );
  assert.ok(
    html.indexOf('data-kp-equation-motion-state="0"') <
      html.indexOf('data-kp-equation-motion-state="1"')
  );
  assert.ok(
    html.indexOf('data-kp-equation-motion-state="1"') <
      html.indexOf('data-kp-equation-motion-state="2"')
  );
  assert.ok(
    html.indexOf('data-kp-equation-motion-state="2"') <
      html.indexOf('data-kp-equation-motion-state="3"')
  );
});

test("renderEditorDocument renders selected fixture animation", () => {
  const html = renderEditorDocument(createInitialEditorDocument(), {
    equationAnimationId: "fixture-fraction-make-inline-to-stacked"
  });

  assert.match(
    html,
    /data-kp-equation-animation-id="fixture-fraction-make-inline-to-stacked"/
  );
  assert.match(html, /data-kp-equation-motion-max-step="1"/);
  assert.match(
    html,
    /option value="fixture-fraction-make-inline-to-stacked" selected>Inline fraction to stacked/
  );
  assert.match(html, /data-kp-equation-motion-latex="x \/ 3"/);
  assert.match(html, /data-kp-equation-motion-latex="\\frac\{x\}\{3\}"/);
  assert.match(
    html,
    /data-kp-motion-id="fraction\.make\.inline-to-stacked\.source\.expression"/
  );
  assert.match(
    html,
    /data-kp-motion-id="fraction\.make\.inline-to-stacked\.target\.expression"/
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

test("updateGraph3DShadowEnabled updates the semantic graph shadow toggle", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DShadowEnabled(
    document,
    "saddle-orbit-graph",
    false
  );
  const originalGraph = document.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.notEqual(nextDocument, document);
  assert.equal(originalGraph?.shadow.enabled, true);
  assert.equal(nextGraph?.shadow.enabled, false);
});

test("updateGraph3DShadowOpacity updates the semantic graph shadow opacity", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DShadowOpacity(
    document,
    "saddle-orbit-graph",
    0.4
  );
  const clampedDocument = updateGraph3DShadowOpacity(
    document,
    "saddle-orbit-graph",
    2
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const clampedGraph = clampedDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.equal(nextGraph?.shadow.opacity, 0.4);
  assert.equal(clampedGraph?.shadow.opacity, 1);
});

test("applyGraph3DLightPreset updates semantic graph light settings", () => {
  const document = createInitialEditorDocument();
  const nextDocument = applyGraph3DLightPreset(
    document,
    "saddle-orbit-graph",
    "raking"
  );
  const originalGraph = document.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.notEqual(nextDocument, document);
  assert.deepEqual(originalGraph?.light, GRAPH_3D_LIGHT_PRESETS.studio);
  assert.deepEqual(nextGraph?.light, GRAPH_3D_LIGHT_PRESETS.raking);
});

test("updateGraph3DLightSetting updates scalar graph light settings", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DLightSetting(
    document,
    "saddle-orbit-graph",
    "ambient",
    0.2
  );
  const clampedDocument = updateGraph3DLightSetting(
    document,
    "saddle-orbit-graph",
    "diffuse",
    2
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
  assert.equal(originalGraph?.light.ambient, 0.45);
  assert.equal(nextGraph?.light.ambient, 0.2);
  assert.equal(nextGraph?.light.diffuse, 0.4);
  assert.equal(clampedGraph?.light.diffuse, 1);
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

test("updateGraph3DSurfaceMode updates the semantic graph render mode", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DSurfaceMode(
    document,
    "saddle-orbit-graph",
    "hyperplanes"
  );
  const originalGraph = document.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.notEqual(nextDocument, document);
  assert.equal(originalGraph?.surfaceMode, "mesh");
  assert.equal(nextGraph?.surfaceMode, "hyperplanes");
});

test("updateGraph3DSurfaceQuality updates the semantic graph render quality", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DSurfaceQuality(
    document,
    "saddle-orbit-graph",
    "interactive"
  );
  const originalGraph = document.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.notEqual(nextDocument, document);
  assert.equal(originalGraph?.surfaceQuality, "balanced");
  assert.equal(nextGraph?.surfaceQuality, "interactive");
});

test("updateGraph3DViewMode updates the semantic graph projection mode", () => {
  const document = createInitialEditorDocument();
  const nextDocument = updateGraph3DViewMode(
    document,
    "saddle-orbit-graph",
    "xy"
  );
  const originalGraph = document.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );
  const nextGraph = nextDocument.objects.find(
    (object): object is Graph3DObject => object.type === "graph-3d"
  );

  assert.deepEqual(GRAPH_3D_VIEW_MODE_IDS, ["3d", "xy"]);
  assert.notEqual(nextDocument, document);
  assert.equal(originalGraph?.viewMode, "3d");
  assert.equal(nextGraph?.viewMode, "xy");
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
