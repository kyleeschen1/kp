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
  assert.match(html, /data-kp-editor-animation-diagnostic-scope="binding"/);
  assert.match(html, /visual-frame\.selector-unbound/);
});

test("selected editor animation includes its diagnostics panel", () => {
  const html = renderEditorDocument(createInitialEditorDocument(), {
    editorAnimationDescriptorId:
      "editor-animation.animation.linear-solve.solve-x"
  });

  assert.match(html, /data-kp-editor-animation-diagnostics/);
  assert.match(html, /animation\.linear-solve\.solve-x\.forward/);
});
