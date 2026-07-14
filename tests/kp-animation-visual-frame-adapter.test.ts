import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationVisualFrame
} from "../src/animation/visual-frame-adapter.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";

test("createKpAnimationVisualFrame binds runtime selectors to renderer nodes", () => {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.linear-solve.cancel",
    animation: createLinearSolveAnimationAsset(),
    progress: 0.5
  });

  const visualFrame = createKpAnimationVisualFrame({
    id: "visual.linear-solve.cancel",
    runtimeFrame,
    bindings: [
      {
        id: "node.render.equation",
        kind: "render-target",
        targetId: "render.linear-solve.equation",
        renderer: "dom",
        ref: "katex-root",
        geometry: { x: 0, y: 0, width: 320, height: 60 }
      },
      {
        id: "node.plus3",
        kind: "selector",
        targetId: "equation.linear-solve.after-subtract.lhs.plus3",
        renderer: "dom",
        ref: "katex-token-plus3",
        geometry: { x: 108, y: 20, width: 18, height: 24 }
      },
      {
        id: "node.minus3",
        kind: "selector",
        targetId: "equation.linear-solve.after-subtract.lhs.minus3",
        renderer: "dom",
        ref: "katex-token-minus3",
        geometry: { x: 132, y: 20, width: 20, height: 24 }
      }
    ]
  });

  assert.equal(visualFrame.id, "visual.linear-solve.cancel");
  assert.equal(visualFrame.kind, "animation-visual-frame");
  assert.equal(visualFrame.runtimeFrameId, "runtime.linear-solve.cancel");
  assert.equal(visualFrame.animationId, "animation.linear-solve.solve-x");
  assert.deepEqual(visualFrame.clock, runtimeFrame.clock);
  assert.deepEqual(
    visualFrame.renderTargetVisuals.map((target) => ({
      renderTargetId: target.renderTargetId,
      kind: target.kind,
      nodeIds: target.nodeIds,
      activeTransformationIds: target.activeTransformationIds
    })),
    [
      {
        renderTargetId: "render.linear-solve.equation",
        kind: "equation",
        nodeIds: ["node.render.equation"],
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ]
      }
    ]
  );
  assert.deepEqual(
    visualFrame.selectorVisuals
      .filter((selector) => selector.roles.includes("focus"))
      .map((selector) => ({
        selectorId: selector.selectorId,
        label: selector.label,
        nodeIds: selector.nodeIds,
        roles: selector.roles,
        activeTransformationIds: selector.activeTransformationIds
      })),
    [
      {
        selectorId: "equation.linear-solve.after-subtract.lhs.plus3",
        label: "+3",
        nodeIds: ["node.plus3"],
        roles: ["source", "focus"],
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ]
      },
      {
        selectorId: "equation.linear-solve.after-subtract.lhs.minus3",
        label: "-3",
        nodeIds: ["node.minus3"],
        roles: ["source", "focus"],
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ]
      }
    ]
  );
  assert.deepEqual(
    visualFrame.nodes.find((node) => node.id === "node.plus3"),
    {
      id: "node.plus3",
      kind: "selector",
      targetId: "equation.linear-solve.after-subtract.lhs.plus3",
      renderer: "dom",
      ref: "katex-token-plus3",
      geometry: { x: 108, y: 20, width: 18, height: 24 }
    }
  );
});

test("createKpAnimationVisualFrame reports missing active visual bindings", () => {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation: createLinearSolveAnimationAsset(),
    progress: 0.5
  });

  const visualFrame = createKpAnimationVisualFrame({
    runtimeFrame,
    bindings: []
  });

  assert.equal(visualFrame.diagnostics[0]?.code, "visual-frame.render-target-unbound");
  assert.equal(visualFrame.diagnostics[0]?.severity, "warning");
  assert.match(
    visualFrame.diagnostics[0]?.message ?? "",
    /render\.linear-solve\.equation/
  );
  assert.ok(
    visualFrame.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "visual-frame.selector-unbound" &&
        diagnostic.path ===
          "selectorFrames[equation.linear-solve.after-subtract.lhs.plus3]"
    )
  );
});
