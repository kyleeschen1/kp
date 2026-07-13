import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssetBuilder } from "../src/animation/asset.ts";
import {
  sampleKpAnimationFrameDescriptor
} from "../src/animation/frame-descriptor.ts";
import {
  createKpSemanticAssetObject
} from "../src/semantic/asset.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";

test("sampleKpAnimationFrameDescriptor creates a renderer-neutral sampled frame", () => {
  const initial = createKpSemanticAssetObject({
    id: "equation.initial",
    objectType: "equation",
    title: "Initial equation",
    value: { latex: "x + 3 = 7" }
  });
  const expanded = createKpSemanticAssetObject({
    id: "equation.expanded",
    objectType: "equation",
    title: "Subtract 3",
    value: { latex: "x + 3 - 3 = 7 - 3" }
  });
  const subtract = createKpSemanticTransformation({
    id: "transform.subtract",
    transformType: "subtractBothSides",
    title: "Subtract 3 from both sides",
    sourceObjectIds: [initial.id],
    targetObjectIds: [expanded.id],
    preserves: ["value", "structure"]
  });
  const animation = createKpAnimationAssetBuilder({
    id: "animation.solve-x",
    title: "Solve x + 3 = 7"
  })
    .addObject(initial)
    .addObject(expanded)
    .addTransformation(subtract)
    .addAnnotation({
      id: "pause.after-subtract",
      kind: "pause",
      targetNodeId: subtract.id,
      placement: "after",
      durationBeats: 1
    })
    .withTimeline({
      id: "timeline.solve-x",
      durationMs: 1000,
      beatCount: 20
    })
    .addRenderTarget({
      id: "render.equation",
      kind: "equation",
      objectIds: [initial.id, expanded.id],
      transformationIds: [subtract.id],
      timelineId: "timeline.solve-x"
    })
    .build();

  assert.deepEqual(
    sampleKpAnimationFrameDescriptor({
      id: "frame.solve-x.forward.0",
      animation,
      direction: "forward",
      progress: 0.25
    }),
    {
      id: "frame.solve-x.forward.0",
      kind: "animation-frame",
      animationId: "animation.solve-x",
      direction: "forward",
      progress: 0.25,
      timelineId: "timeline.solve-x",
      elapsedMs: 250,
      beat: 5,
      phaseIndex: 0,
      phaseId: "animation.solve-x.forward.0",
      nodeIds: ["transform.subtract"],
      annotationIdsByPlacement: {
        before: [],
        during: [],
        after: ["pause.after-subtract"]
      },
      semanticObjectIds: ["equation.initial", "equation.expanded"],
      transformationIds: ["transform.subtract"],
      renderTargets: [
        {
          id: "render.equation",
          kind: "equation",
          objectIds: ["equation.initial", "equation.expanded"],
          selectorIds: [],
          transformationIds: ["transform.subtract"],
          timelineId: "timeline.solve-x"
        }
      ],
      diagnostics: []
    }
  );
});
