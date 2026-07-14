import assert from "node:assert/strict";
import test from "node:test";

import {
  createLinearMapVectorAnimationAsset
} from "../src/animation/graph-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createGraphRuntimeVisualFrame
} from "../src/rendering/graph-runtime-visual-frame-adapter.ts";

test("createGraphRuntimeVisualFrame binds graph render targets and vector selectors", () => {
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.graph.vector.midpoint",
    animation: createLinearMapVectorAnimationAsset(),
    progress: 0.5
  });

  const visualFrame = createGraphRuntimeVisualFrame({
    id: "visual.graph.vector.midpoint",
    runtimeFrame,
    renderTargetRef: "svg-vector-plane",
    renderTargetGeometry: { x: 0, y: 0, width: 520, height: 360 }
  });

  assert.equal(visualFrame.id, "visual.graph.vector.midpoint");
  assert.deepEqual(visualFrame.clock, runtimeFrame.clock);
  assert.deepEqual(visualFrame.diagnostics, []);
  assert.deepEqual(visualFrame.renderTargetVisuals, [
    {
      renderTargetId: "render.graph.vector.linear-map-scale",
      kind: "graph",
      nodeIds: ["graph-render-target.render.graph.vector.linear-map-scale"],
      objectIds: [
        "graph.vector-plane",
        "linear-map.scale",
        "vector.scale.source",
        "vector.scale.target"
      ],
      selectorIds: [
        "vector.scale.source.body",
        "vector.scale.target.body"
      ],
      activeTransformationIds: [
        "transform.graph.vector.apply-linear-map-scale"
      ]
    }
  ]);
  assert.deepEqual(
    visualFrame.selectorVisuals.map((selector) => ({
      selectorId: selector.selectorId,
      nodeIds: selector.nodeIds,
      roles: selector.roles
    })),
    [
      {
        selectorId: "linear-map.scale.map",
        nodeIds: ["graph-selector.linear-map.scale.map"],
        roles: ["source", "target", "correspondence-source", "correspondence-target"]
      },
      {
        selectorId: "vector.scale.source.body",
        nodeIds: ["graph-selector.vector.scale.source.body"],
        roles: ["source", "correspondence-source"]
      },
      {
        selectorId: "vector.scale.source.x",
        nodeIds: ["graph-selector.vector.scale.source.x"],
        roles: ["source"]
      },
      {
        selectorId: "vector.scale.source.y",
        nodeIds: ["graph-selector.vector.scale.source.y"],
        roles: ["source"]
      },
      {
        selectorId: "vector.scale.target.body",
        nodeIds: ["graph-selector.vector.scale.target.body"],
        roles: ["target", "correspondence-target"]
      },
      {
        selectorId: "vector.scale.target.x",
        nodeIds: ["graph-selector.vector.scale.target.x"],
        roles: ["target"]
      },
      {
        selectorId: "vector.scale.target.y",
        nodeIds: ["graph-selector.vector.scale.target.y"],
        roles: ["target"]
      }
    ]
  );
  assert.deepEqual(
    visualFrame.nodes.find(
      (node) => node.id === "graph-selector.vector.scale.source.body"
    ),
    {
      id: "graph-selector.vector.scale.source.body",
      kind: "selector",
      targetId: "vector.scale.source.body",
      renderer: "svg",
      ref: "graph-selector.vector.scale.source.body"
    }
  );
});
