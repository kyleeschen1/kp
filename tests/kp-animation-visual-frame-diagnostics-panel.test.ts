import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpAnimationVisualFrame
} from "../src/animation/visual-frame-adapter.ts";
import {
  createKpAnimationVisualFrameDiagnosticsPanelData
} from "../src/animation/visual-frame-diagnostics-panel.ts";
import {
  createLinearSolveRuntimeVisualFrameSample
} from "../src/rendering/linear-solve-runtime-visual-sample.ts";

test("createKpAnimationVisualFrameDiagnosticsPanelData summarizes a clean visual frame", () => {
  const sample = createLinearSolveRuntimeVisualFrameSample();
  const panel = createKpAnimationVisualFrameDiagnosticsPanelData(
    sample.visualFrame
  );

  assert.deepEqual(panel, {
    id: "diagnostics.visual.linear-solve.visual-sample",
    kind: "animation-visual-frame-diagnostics-panel",
    visualFrameId: "visual.linear-solve.visual-sample",
    runtimeFrameId: "runtime.linear-solve.visual-sample",
    animationId: "animation.linear-solve.solve-x",
    status: "passed",
    severityCounts: {
      info: 0,
      warning: 0,
      error: 0
    },
    bindingSummary: {
      nodeCount: 15,
      renderTargetCount: 1,
      boundRenderTargetCount: 1,
      unboundRenderTargetCount: 0,
      selectorCount: 12,
      boundSelectorCount: 12,
      unboundSelectorCount: 0
    },
    diagnostics: [],
    searchFields: [
      "visual-frame-diagnostics-panel",
      "visual-frame:visual.linear-solve.visual-sample",
      "runtime-frame:runtime.linear-solve.visual-sample",
      "animation:animation.linear-solve.solve-x",
      "visual-diagnostics:passed",
      "visual-diagnostics-warning:0",
      "visual-diagnostics-error:0",
      "visual-bindings-targets:1/1",
      "visual-bindings-selectors:12/12",
      "visual-bindings-nodes:15"
    ]
  });
});

test("createKpAnimationVisualFrameDiagnosticsPanelData reports unbound visual frame diagnostics", () => {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation: createLinearSolveAnimationAsset(),
    progress: 0.5
  });
  const visualFrame = createKpAnimationVisualFrame({
    id: "visual.linear-solve.unbound",
    runtimeFrame,
    bindings: []
  });
  const panel = createKpAnimationVisualFrameDiagnosticsPanelData(visualFrame);

  assert.equal(panel.status, "warning");
  assert.deepEqual(panel.severityCounts, {
    info: 0,
    warning: 13,
    error: 0
  });
  assert.deepEqual(panel.bindingSummary, {
    nodeCount: 0,
    renderTargetCount: 1,
    boundRenderTargetCount: 0,
    unboundRenderTargetCount: 1,
    selectorCount: 12,
    boundSelectorCount: 0,
    unboundSelectorCount: 12
  });
  assert.deepEqual(panel.diagnostics[0], {
    id: "diagnostic.visual.linear-solve.unbound.0",
    severity: "warning",
    code: "visual-frame.render-target-unbound",
    path: "activeRenderTargets[render.linear-solve.equation]",
    message:
      "Active render target render.linear-solve.equation has no visual binding."
  });
  assert.ok(
    panel.searchFields.includes(
      "visual-diagnostic-code:visual-frame.selector-unbound"
    )
  );
  assert.ok(panel.searchFields.includes("visual-diagnostics:warning"));
});
