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

test("spatially coherent pairing preserves normalized silhouette neighborhoods", () => {
  const particles = pairKatexArtifactPixelFlowPoints(
    [
      { x: 0, y: 0, alpha: 1 },
      { x: 10, y: 0, alpha: 1 },
      { x: 0, y: 10, alpha: 1 },
      { x: 10, y: 10, alpha: 1 }
    ],
    [
      { x: 100, y: 200, alpha: 1 },
      { x: 140, y: 200, alpha: 1 },
      { x: 100, y: 280, alpha: 1 },
      { x: 140, y: 280, alpha: 1 }
    ],
    4,
    "spatial-coherent"
  );

  assert.deepEqual(
    particles.map((particle) => [
      particle.sourceX / 10,
      particle.sourceY / 10,
      (particle.targetX - 100) / 40,
      (particle.targetY - 200) / 80
    ]),
    [
      [0, 0, 0, 0],
      [1, 0, 1, 0],
      [0, 1, 0, 1],
      [1, 1, 1, 1]
    ]
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

test("createKatexArtifactPixelFlowFrame lifts, collapses to 1px dots, streams as a filament, and forms the target", () => {
  const particles = pairKatexArtifactPixelFlowPoints(
    [{ x: 16, y: 10, alpha: 1 }],
    [{ x: 50, y: 20, alpha: 1 }],
    1
  );
  const plan = pixelFlowPlan({
    start: 0,
    end: 1,
    sourceMotion: {
      kind: "anticipate-collapse-emitter",
      anticipationOffset: { x: 0, y: -12 },
      anticipationEnd: 0.24,
      pauseEnd: 0.34,
      collapseEnd: 0.56,
      collapsedPointSize: 1
    },
    pathMotion: {
      kind: "filament-stream",
      formStart: 0.88,
      filamentWidth: 0.7
    },
    targetMotion: {
      kind: "late-radical-form",
      formStart: 0.88
    }
  });
  const anticipated = createKatexArtifactPixelFlowFrame(plan, particles, 0.24);
  const paused = createKatexArtifactPixelFlowFrame(plan, particles, 0.28);
  const collapsed = createKatexArtifactPixelFlowFrame(plan, particles, 0.56);
  const filament = createKatexArtifactPixelFlowFrame(plan, particles, 0.72);
  const forming = createKatexArtifactPixelFlowFrame(plan, particles, 0.94);

  assert.equal(anticipated.particles[0]?.x, 16);
  assert.equal(anticipated.particles[0]?.y, -2);
  assert.equal(paused.particles[0]?.x, 16);
  assert.equal(paused.particles[0]?.y, -2);
  assert.equal(collapsed.particles[0]?.x, 10);
  assert.equal(collapsed.particles[0]?.y, 10);
  assert.equal(collapsed.particles[0]?.pointSize, 1);
  assert.equal(collapsed.particles[0]?.opacity, 1);
  assert.ok(Math.abs((filament.particles[0]?.x ?? 0) - 25) < 1e-9);
  assert.ok(Math.abs((filament.particles[0]?.y ?? 0) - 10) <= 0.7);
  assert.equal(filament.particles[0]?.pointSize, 1);
  assert.equal(filament.particles[0]?.opacity, 1);
  assert.ok((forming.particles[0]?.x ?? 0) > 25);
  assert.ok((forming.particles[0]?.y ?? 0) > 10);
  assert.ok((forming.particles[0]?.pointSize ?? 0) > 1);
});

function pixelFlowPlan(overrides: {
  readonly start?: number | undefined;
  readonly end?: number | undefined;
  readonly sourceMotion?:
    | {
        readonly kind: "anticipate-collapse-emitter";
        readonly anticipationOffset: { readonly x: number; readonly y: number };
        readonly anticipationEnd: number;
        readonly pauseEnd: number;
        readonly collapseEnd: number;
        readonly collapsedPointSize: number;
      }
    | undefined;
  readonly pathMotion?:
    | {
        readonly kind: "filament-stream";
        readonly formStart: number;
        readonly filamentWidth: number;
      }
    | undefined;
  readonly targetMotion?:
    | {
        readonly kind: "late-radical-form";
        readonly formStart: number;
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
    sourceMotion: overrides.sourceMotion,
    pathMotion: overrides.pathMotion,
    targetMotion: overrides.targetMotion
  };
}
