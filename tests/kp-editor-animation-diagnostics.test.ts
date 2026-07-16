import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpEditorAnimationDiagnostics,
  renderKpEditorAnimationDiagnostics
} from "../src/editor/animation-diagnostics.ts";
import {
  createInitialEditorDocument,
  renderEditorDocument
} from "../src/editor/editor.ts";
import {
  createKpEditorAnimationAuthoringState,
  createKpEditorAnimationRegenerationRequest,
  updateKpEditorAnimationAuthoringControl
} from "../src/editor/animation-authoring-controls.ts";

test("editor diagnostics expose sampled runtime state and missing bindings", () => {
  const catalog = createKpAnimationAssets();
  const diagnostics = createKpEditorAnimationDiagnostics({
    animation: catalog[0]!,
    catalog
  });

  assert.equal(diagnostics.status, "warning");
  assert.equal(diagnostics.progress, 0.5);
  assert.equal(diagnostics.bindingSummary.renderTargetCount, 1);
  assert.equal(diagnostics.bindingSummary.boundRenderTargetCount, 0);
  assert.ok(diagnostics.severityCounts.info > 0);
  assert.ok(diagnostics.severityCounts.warning > 0);
  assert.deepEqual(
    diagnostics.playbackLaws.map((law) => [law.lawId, law.passed]),
    [
      ["animation.seek-rewind", true],
      ["animation-runtime.rewind-clock", true]
    ]
  );
  assert.ok(
    diagnostics.rows.some(
      (row) => row.code === "visual-frame.render-target-unbound"
    )
  );
});

test("editor diagnostics render inspectable severity and binding metadata", () => {
  const catalog = createKpAnimationAssets();
  const diagnostics = createKpEditorAnimationDiagnostics({
    animation: catalog[0]!,
    catalog
  });
  const html = renderKpEditorAnimationDiagnostics(diagnostics);

  assert.match(html, /data-kp-editor-animation-diagnostics-status="warning"/);
  assert.match(html, /Render targets bound/);
  assert.match(html, /Playback laws/);
  assert.match(html, /data-kp-editor-animation-diagnostics-playback-laws>2\/2</);
  assert.match(html, /data-kp-editor-animation-diagnostic-scope="binding"/);
  assert.match(html, /visual-frame\.selector-unbound/);
});

test("selected editor animation includes its diagnostics panel", () => {
  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId:
      "editor-animation.animation.linear-solve.solve-x"
  });

  assert.match(html, /data-kp-editor-animation-diagnostics/);
  assert.match(html, /data-kp-editor-animation-diagnostics-status="passed"/);
  assert.match(html, /data-kp-editor-animation-diagnostics-targets>1\/1</);
  assert.match(html, /data-kp-editor-animation-diagnostics-selectors>10\/10</);
  assert.match(html, /animation\.linear-solve\.solve-x\.forward/);
});

test("authoring controls produce inspectable canonical regeneration requests", () => {
  const disclosure = updateKpEditorAnimationAuthoringControl({
    state: createKpEditorAnimationAuthoringState(),
    controlId: "correctness-disclosure",
    value: "learner-request"
  });
  const gaps = updateKpEditorAnimationAuthoringControl({
    state: disclosure,
    controlId: "gap-policy",
    value: "strict"
  });
  const request = createKpEditorAnimationRegenerationRequest({
    animationId: "animation.generated.intentional-error",
    state: gaps
  });

  assert.equal(request.authoringRevision, 2);
  assert.equal(request.semantic.correctnessDisclosure, "learner-request");
  assert.equal(request.semantic.gapPolicy, "strict");
  assert.equal(request.presentation.pathPreference, "automatic");
  assert.equal("coordinates" in request.presentation, false);
  assert.equal("keyframes" in request.presentation, false);
});
