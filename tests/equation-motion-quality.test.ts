import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpMotionQuality,
  sampleKpContinuousMotionPose,
  type KpMotionQualityFrameSample
} from "../src/rendering/equation-motion-quality.ts";
import { planKpEquationMotionPathBetweenPoints } from "../src/rendering/equation-motion-path-planner.ts";

test("continuous path interpolation preserves endpoints and passes quality budgets", () => {
  const path = planKpEquationMotionPathBetweenPoints({
    id: "path.quality",
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    variants: ["arc-above"]
  }).selected;
  const samples: KpMotionQualityFrameSample[] = Array.from(
    { length: 41 },
    (_value, index) => {
      const progress = index / 40;
      const pose = sampleKpContinuousMotionPose({
        path,
        progress,
        fromScale: 0.8,
        toScale: 1
      });
      return {
        progress,
        entities: [{ id: "copy", ...pose, opacity: 1, salient: true }]
      };
    }
  );
  const report = evaluateKpMotionQuality({
    samples,
    motifBoundaryProgresses: [0.25, 0.5, 0.75]
  });

  assert.deepEqual(sampleKpContinuousMotionPose({ path, progress: 0 }), {
    x: 0,
    y: 0,
    scale: 1
  });
  assert.deepEqual(sampleKpContinuousMotionPose({ path, progress: 1 }), {
    x: 100,
    y: 0,
    scale: 1
  });
  assert.equal(report.passed, true);
  assert.equal(report.diagnostics.some((item) => item.severity === "error"), false);
  assert.ok(report.metrics.maxPositionStep < 10);
});

test("quality gate reports position, scale, velocity, and boundary discontinuities", () => {
  const report = evaluateKpMotionQuality({
    samples: [
      frame(0, 0, 1),
      frame(0.49, 2, 1),
      frame(0.51, 60, 1.5),
      frame(1, 62, 1.5)
    ],
    motifBoundaryProgresses: [0.5],
    budget: {
      maxVelocityPerSecond: 100,
      maxAccelerationPerSecondSquared: 200
    }
  });
  const codes = new Set(report.diagnostics.map((item) => item.code));

  assert.equal(report.passed, false);
  assert.ok(codes.has("motion.position-discontinuity"));
  assert.ok(codes.has("motion.scale-discontinuity"));
  assert.ok(codes.has("motion.velocity-budget"));
  assert.ok(codes.has("motion.acceleration-budget"));
  assert.ok(codes.has("motion.boundary-discontinuity"));
});

test("quality gate distinguishes collisions, crowding, and salience gaps", () => {
  const report = evaluateKpMotionQuality({
    samples: [
      {
        progress: 0,
        entities: [
          { id: "a", x: 0, y: 0, scale: 1, opacity: 0.2, radius: 4, salient: true },
          { id: "b", x: 7, y: 0, scale: 1, opacity: 1, radius: 4 }
        ]
      },
      {
        progress: 1,
        entities: [
          { id: "a", x: 0, y: 0, scale: 1, opacity: 1, radius: 4, salient: true },
          { id: "b", x: 13, y: 0, scale: 1, opacity: 1, radius: 4 }
        ]
      }
    ],
    budget: {
      maxPositionStep: 20,
      maxVelocityPerSecond: 20,
      maxAccelerationPerSecondSquared: 100
    }
  });
  const diagnosticsByCode = new Map(report.diagnostics.map((item) => [item.code, item]));

  assert.equal(diagnosticsByCode.get("motion.collision")?.severity, "error");
  assert.equal(diagnosticsByCode.get("motion.crowding")?.severity, "warning");
  assert.equal(diagnosticsByCode.get("motion.salience-gap")?.severity, "error");
  assert.ok(report.metrics.minEntitySeparation !== null);
});

test("quality evaluation is deterministic for direct seek sample sets", () => {
  const samples = [frame(1, 10, 1), frame(0, 0, 1), frame(0.5, 5, 1)];
  assert.deepEqual(
    evaluateKpMotionQuality({ samples }),
    evaluateKpMotionQuality({ samples: [...samples].reverse() })
  );
});

function frame(progress: number, x: number, scale: number): KpMotionQualityFrameSample {
  return {
    progress,
    entities: [{ id: "entity", x, y: 0, scale, opacity: 1, salient: true }]
  };
}
