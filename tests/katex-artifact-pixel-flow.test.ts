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

test("createKatexArtifactPixelFlowFrame can bounce source pixels then collapse them to an emitter", () => {
  const particles = pairKatexArtifactPixelFlowPoints(
    [{ x: 16, y: 10, alpha: 1 }],
    [{ x: 40, y: 10, alpha: 1 }],
    1
  );
  const plan = pixelFlowPlan({
    start: 0,
    end: 1,
    sourceMotion: {
      kind: "bounce-collapse-emitter",
      bounceStrength: 0.5,
      bounceEnd: 0.25,
      collapseEnd: 0.45
    }
  });
  const bounced = createKatexArtifactPixelFlowFrame(plan, particles, 0.25);
  const collapsed = createKatexArtifactPixelFlowFrame(plan, particles, 0.45);
  const streaming = createKatexArtifactPixelFlowFrame(plan, particles, 0.725);

  assert.equal(bounced.particles[0]?.x, 19);
  assert.equal(bounced.particles[0]?.y, 10);
  assert.equal(collapsed.particles[0]?.x, 10);
  assert.equal(collapsed.particles[0]?.y, 10);
  assert.ok(Math.abs((streaming.particles[0]?.x ?? 0) - 25) < 1e-9);
  assert.ok(Math.abs((streaming.particles[0]?.y ?? 0) - 10) < 1e-9);
});

function pixelFlowPlan(overrides: {
  readonly start?: number | undefined;
  readonly end?: number | undefined;
  readonly sourceMotion?:
    | {
        readonly kind: "bounce-collapse-emitter";
        readonly bounceStrength: number;
        readonly bounceEnd: number;
        readonly collapseEnd: number;
      }
    | undefined;
}) {
  return {
    id: "radical-artifact-pixel-flow",
    kind: "artifact-pixel-flow" as const,
    source: {
      tokenId: "source-artifact",
      rect: { left: 0, top: 0, width: 20, height: 20 }
    },
    target: {
      tokenId: "target-artifact",
      rect: { left: 30, top: 0, width: 20, height: 20 }
    },
    particleCount: 512,
    start: overrides.start ?? 0,
    end: overrides.end ?? 1,
    easing: "linear" as const,
    sourceMotion: overrides.sourceMotion
  };
}
