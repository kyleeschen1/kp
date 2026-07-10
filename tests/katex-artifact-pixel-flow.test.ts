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

test("createKatexArtifactPixelFlowFrame can anticipate, collapse, stream as a filament, and form the target", () => {
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
      anticipationOffset: { x: 12, y: -8 },
      anticipationEnd: 0.2,
      pauseEnd: 0.32,
      collapseEnd: 0.52,
      minScale: 0.06
    },
    pathMotion: {
      kind: "filament-stream",
      formStart: 0.84,
      filamentWidth: 1.2
    },
    targetMotion: {
      kind: "late-radical-form",
      formStart: 0.84
    }
  });
  const anticipated = createKatexArtifactPixelFlowFrame(plan, particles, 0.2);
  const paused = createKatexArtifactPixelFlowFrame(plan, particles, 0.28);
  const collapsed = createKatexArtifactPixelFlowFrame(plan, particles, 0.52);
  const filament = createKatexArtifactPixelFlowFrame(plan, particles, 0.68);
  const forming = createKatexArtifactPixelFlowFrame(plan, particles, 0.92);

  assert.equal(anticipated.particles[0]?.x, 28);
  assert.equal(anticipated.particles[0]?.y, 2);
  assert.equal(paused.particles[0]?.x, 28);
  assert.equal(paused.particles[0]?.y, 2);
  assert.equal(collapsed.particles[0]?.x, 10);
  assert.equal(collapsed.particles[0]?.y, 10);
  assert.ok((collapsed.particles[0]?.pointSize ?? 0) < 0.2);
  assert.ok((collapsed.particles[0]?.opacity ?? 0) < 0.1);
  assert.ok(Math.abs((filament.particles[0]?.x ?? 0) - 25) < 1e-9);
  assert.ok(Math.abs((filament.particles[0]?.y ?? 0) - 10) <= 1.2);
  assert.ok(
    (filament.particles[0]?.pointSize ?? 0) <
      (collapsed.particles[0]?.pointSize ?? 0)
  );
  assert.ok((forming.particles[0]?.x ?? 0) > 25);
  assert.ok((forming.particles[0]?.y ?? 0) > 10);
  assert.ok((forming.particles[0]?.pointSize ?? 0) > 0.2);
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
        readonly minScale: number;
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
