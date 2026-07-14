import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";

test("sampleKpAnimationRuntimeFrame samples a renderer-neutral frame from elapsed time", () => {
  const animation = createLinearSolveAnimationAsset();
  const frame = sampleKpAnimationRuntimeFrame({
    id: "runtime.linear-solve.middle",
    animation,
    elapsedMs: 1200
  });

  assert.equal(frame.id, "runtime.linear-solve.middle");
  assert.equal(frame.kind, "animation-runtime-frame");
  assert.equal(frame.rendererNeutral, true);
  assert.deepEqual(frame.clock, {
    direction: "forward",
    progress: 0.5,
    timelineId: "timeline.linear-solve.shared",
    durationMs: 2400,
    elapsedMs: 1200,
    beatCount: 50,
    beat: 25
  });
  assert.equal(frame.phase.phaseId, "animation.linear-solve.solve-x.forward.1");
  assert.deepEqual(frame.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.deepEqual(frame.activeRenderTargets, [
    {
      id: "render.linear-solve.equation",
      kind: "equation",
      objectIds: [
        "equation.linear-solve.initial",
        "equation.linear-solve.after-subtract",
        "equation.linear-solve.left-simplified",
        "equation.linear-solve.solved"
      ],
      selectorIds: [],
      transformationIds: [
        "transform.linear-solve.subtract-both-sides-3",
        "transform.linear-solve.cancel-left-additive-inverse",
        "transform.linear-solve.simplify-right-difference"
      ],
      activeTransformationIds: [
        "transform.linear-solve.cancel-left-additive-inverse"
      ],
      timelineId: "timeline.linear-solve.shared"
    }
  ]);
  assert.deepEqual(
    frame.semanticObjectRefs.map((ref) => ref.objectId),
    [
      "equation.linear-solve.initial",
      "equation.linear-solve.after-subtract",
      "equation.linear-solve.left-simplified",
      "equation.linear-solve.solved"
    ]
  );
  assert.deepEqual(frame.frameDescriptor, {
    id: "runtime.linear-solve.middle.frame",
    kind: "animation-frame",
    animationId: "animation.linear-solve.solve-x",
    direction: "forward",
    progress: 0.5,
    timelineId: "timeline.linear-solve.shared",
    elapsedMs: 1200,
    beat: 25,
    phaseIndex: 1,
    phaseId: "animation.linear-solve.solve-x.forward.1",
    nodeIds: ["transform.linear-solve.cancel-left-additive-inverse"],
    annotationIdsByPlacement: {
      before: [],
      during: ["focus.linear-solve.cancel"],
      after: ["pause.linear-solve.cancel"]
    },
    semanticObjectIds: [
      "equation.linear-solve.initial",
      "equation.linear-solve.after-subtract",
      "equation.linear-solve.left-simplified",
      "equation.linear-solve.solved"
    ],
    transformationIds: [
      "transform.linear-solve.cancel-left-additive-inverse"
    ],
    renderTargets: [
      {
        id: "render.linear-solve.equation",
        kind: "equation",
        objectIds: [
          "equation.linear-solve.initial",
          "equation.linear-solve.after-subtract",
          "equation.linear-solve.left-simplified",
          "equation.linear-solve.solved"
        ],
        selectorIds: [],
        transformationIds: [
          "transform.linear-solve.subtract-both-sides-3",
          "transform.linear-solve.cancel-left-additive-inverse",
          "transform.linear-solve.simplify-right-difference"
        ],
        timelineId: "timeline.linear-solve.shared"
      }
    ],
    diagnostics: []
  });
  assert.deepEqual(frame.diagnostics, []);
});

test("sampleKpAnimationRuntimeFrame normalizes beats, progress, and rewind direction", () => {
  const animation = createLinearSolveAnimationAsset();
  const byBeat = sampleKpAnimationRuntimeFrame({
    animation,
    beat: 25
  });
  const byProgress = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.5
  });
  const rewind = sampleKpAnimationRuntimeFrame({
    animation,
    direction: "rewind",
    progress: 0.5
  });
  const clamped = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 2
  });

  assert.equal(byBeat.clock.progress, 0.5);
  assert.equal(byBeat.clock.elapsedMs, 1200);
  assert.equal(byProgress.clock.beat, 25);
  assert.equal(rewind.clock.direction, "rewind");
  assert.equal(rewind.phase.phaseId, "animation.linear-solve.solve-x.rewind.1");
  assert.deepEqual(rewind.activeTransformationIds, [
    "transform.linear-solve.cancel-left-additive-inverse"
  ]);
  assert.equal(clamped.clock.progress, 1);
  assert.equal(clamped.clock.elapsedMs, 2400);
  assert.equal(clamped.clock.beat, 50);
});
