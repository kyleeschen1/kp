import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKatexArtifactPixelFlowFrame,
  pairKatexArtifactPixelFlowPoints,
  sampleKatexArtifactPixelFlowProgress
} from "../src/rendering/katex-artifact-pixel-flow.ts";

test("sampleKatexArtifactPixelFlowProgress maps global progress into a reversible beat", () => {
  const plan = pixelFlowPlan({ start: 0.2, end: 0.8 });

  assert.equal(sampleKatexArtifactPixelFlowProgress(plan, 0), 0);
  assert.equal(sampleKatexArtifactPixelFlowProgress(plan, 0.2), 0);
  assert.equal(sampleKatexArtifactPixelFlowProgress(plan, 0.5), 0.5);
  assert.equal(sampleKatexArtifactPixelFlowProgress(plan, 0.8), 1);
  assert.equal(sampleKatexArtifactPixelFlowProgress(plan, 1), 1);

  const forward = sampleKatexArtifactPixelFlowProgress(plan, 0.35);
  const backward = sampleKatexArtifactPixelFlowProgress(plan, 0.65);

  assert.equal(forward, 0.25);
  assert.equal(backward, 0.75);
  assert.equal(1 - forward, backward);
});

test("pairKatexArtifactPixelFlowPoints creates deterministic source-to-target particles", () => {
  const particles = pairKatexArtifactPixelFlowPoints(
    [
      { x: 1, y: 2, alpha: 0.25 },
      { x: 3, y: 4, alpha: 0.5 }
    ],
    [{ x: 10, y: 20, alpha: 0.75 }],
    3
  );

  assert.equal(particles.length, 3);
  assert.deepEqual(
    particles.map((particle) => [particle.sourceX, particle.sourceY]),
    [
      [1, 2],
      [3, 4],
      [1, 2]
    ]
  );
  assert.deepEqual(
    particles.map((particle) => [particle.targetX, particle.targetY]),
    [
      [10, 20],
      [10, 20],
      [10, 20]
    ]
  );
  assert.deepEqual(
    particles.map((particle) => particle.alpha),
    [0.75, 0.75, 0.75]
  );
  assert.ok(
    particles.every((particle) => particle.seed >= 0 && particle.seed <= 1)
  );
});

test("createKatexArtifactPixelFlowFrame interpolates particles with no semantic jumps", () => {
  const particles = pairKatexArtifactPixelFlowPoints(
    [{ x: 0, y: 10, alpha: 1 }],
    [{ x: 20, y: 30, alpha: 1 }],
    1
  );
  const frame = createKatexArtifactPixelFlowFrame(
    pixelFlowPlan({ start: 0, end: 1 }),
    particles,
    0.5
  );

  assert.equal(frame.progress, 0.5);
  assert.equal(frame.particles.length, 1);
  assert.equal(frame.particles[0]?.x, 10);
  assert.equal(frame.particles[0]?.y, 20);
  assert.equal(frame.particles[0]?.opacity, 1);
  assert.ok((frame.particles[0]?.pointSize ?? 0) > 0);
});

function pixelFlowPlan(overrides: {
  readonly start?: number | undefined;
  readonly end?: number | undefined;
}) {
  return {
    id: "radical-artifact-pixel-flow",
    kind: "artifact-pixel-flow" as const,
    source: {
      tokenId: "source-artifact",
      rect: { left: 10, top: 20, width: 30, height: 12 }
    },
    target: {
      tokenId: "target-artifact",
      rect: { left: 14, top: 18, width: 36, height: 16 }
    },
    particleCount: 512,
    start: overrides.start ?? 0,
    end: overrides.end ?? 1,
    easing: "linear" as const
  };
}
