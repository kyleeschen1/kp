import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationRuntimeScrubberControl,
  sampleKpAnimationRuntimeFrameFromScrubber,
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createLinearSolveProgrammingComparisonAnimationAsset
} from "../src/animation/comparison-layout-adapter.ts";
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

test("sampleKpAnimationRuntimeFrame exposes phase and selector diagnostics", () => {
  const animation = createLinearSolveAnimationAsset();
  const frame = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.5
  });

  assert.deepEqual(frame.activeAnnotationIds, [
    "focus.linear-solve.cancel",
    "pause.linear-solve.cancel"
  ]);
  assert.deepEqual(frame.focusSelectorIds, [
    "equation.linear-solve.after-subtract.lhs.plus3",
    "equation.linear-solve.after-subtract.lhs.minus3"
  ]);
  assert.deepEqual(
    frame.selectorFrames
      .filter((selector) => selector.roles.includes("focus"))
      .map((selector) => ({
        id: selector.id,
        objectId: selector.objectId,
        label: selector.label,
        roles: selector.roles,
        annotationIds: selector.annotationIds
      })),
    [
      {
        id: "equation.linear-solve.after-subtract.lhs.plus3",
        objectId: "equation.linear-solve.after-subtract",
        label: "+3",
        roles: ["source", "focus"],
        annotationIds: ["focus.linear-solve.cancel"]
      },
      {
        id: "equation.linear-solve.after-subtract.lhs.minus3",
        objectId: "equation.linear-solve.after-subtract",
        label: "-3",
        roles: ["source", "focus"],
        annotationIds: ["focus.linear-solve.cancel"]
      }
    ]
  );
  assert.deepEqual(
    frame.selectorFrames.find(
      (selector) => selector.id === "equation.linear-solve.after-subtract.lhs.x"
    ),
    {
      id: "equation.linear-solve.after-subtract.lhs.x",
      objectId: "equation.linear-solve.after-subtract",
      kind: "term",
      label: "x",
      roles: ["source", "correspondence-source"],
      activeTransformationIds: [
        "transform.linear-solve.cancel-left-additive-inverse"
      ],
      annotationIds: [],
      renderTargetIds: ["render.linear-solve.equation"]
    }
  );
  assert.deepEqual(frame.phaseDiagnostics, [
    {
      severity: "info",
      code: "runtime.phase.active-transformations",
      path: "phase.nodeIds",
      message:
        "Phase animation.linear-solve.solve-x.forward.1 activates 1 transformation(s)."
    },
    {
      severity: "info",
      code: "runtime.phase.annotations",
      path: "phase.annotationIdsByPlacement",
      message:
        "Phase animation.linear-solve.solve-x.forward.1 exposes 2 annotation(s)."
    }
  ]);
  assert.deepEqual(frame.selectorDiagnostics, [
    {
      severity: "info",
      code: "runtime.selector.context",
      path: "selectorFrames",
      message: "12 selector(s) are in the active source/target context."
    },
    {
      severity: "info",
      code: "runtime.selector.focus",
      path: "focusSelectorIds",
      message: "2 selector(s) are focus-active."
    }
  ]);
});

test("sampleKpAnimationRuntimeFrame samples referenced child animations for composed layouts", () => {
  const animation = createLinearSolveProgrammingComparisonAnimationAsset();
  const frame = sampleKpAnimationRuntimeFrame({
    id: "runtime.comparison.middle",
    animation,
    progress: 0.5,
    childAnimations: createKpAnimationAssets()
  });

  assert.deepEqual(
    frame.childFrames.map((child) => ({
      renderTargetId: child.renderTargetId,
      animationId: child.animationId,
      progress: child.frame.clock.progress,
      phaseId: child.frame.phase.phaseId,
      activeTransformationIds: child.frame.activeTransformationIds
    })),
    [
      {
        renderTargetId: "render.comparison.linear-solve.equation",
        animationId: "animation.linear-solve.solve-x",
        progress: 0.5,
        phaseId: "animation.linear-solve.solve-x.forward.1",
        activeTransformationIds: [
          "transform.linear-solve.cancel-left-additive-inverse"
        ]
      },
      {
        renderTargetId: "render.comparison.programming.trace",
        animationId: "animation.programming.add.execution-trace",
        progress: 0.5,
        phaseId: "animation.programming.add.execution-trace.forward.2",
        activeTransformationIds: ["transform.programming.add.return"]
      }
    ]
  );
  assert.deepEqual(frame.childDiagnostics, [
    {
      severity: "info",
      code: "runtime.child.frames",
      path: "childFrames",
      message: "2 child animation frame(s) sampled from render target metadata."
    }
  ]);
});

test("runtime scrubber control samples frames through the shared beat clock", () => {
  const animation = createLinearSolveAnimationAsset();
  const scrubber = createKpAnimationRuntimeScrubberControl(animation);
  const frame = sampleKpAnimationRuntimeFrameFromScrubber({
    animation,
    scrubber,
    value: 25
  });

  assert.deepEqual(scrubber, {
    id: "scrubber.animation.linear-solve.solve-x",
    kind: "animation-runtime-scrubber",
    animationId: "animation.linear-solve.solve-x",
    timelineId: "timeline.linear-solve.shared",
    unit: "beat",
    min: 0,
    max: 50,
    step: 1,
    defaultValue: 25,
    defaultProgress: 0.5
  });
  assert.equal(frame.clock.progress, 0.5);
  assert.equal(frame.clock.beat, 25);
  assert.equal(frame.phase.phaseId, "animation.linear-solve.solve-x.forward.1");
});
