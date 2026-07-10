import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKatexArtifactSeedRevealFrame,
  sampleKatexArtifactSeedRevealProgress
} from "../src/rendering/katex-artifact-seed-reveal.ts";
import type { KatexAtlasRegion } from "../src/rendering/katex-transition-types.ts";

test("sampleKatexArtifactSeedRevealProgress maps global progress into a reversible beat", () => {
  const plan = seedRevealPlan({ start: 0.2, end: 0.8 });

  assert.equal(sampleKatexArtifactSeedRevealProgress(plan, 0), 0);
  assert.equal(sampleKatexArtifactSeedRevealProgress(plan, 0.2), 0);
  assert.equal(sampleKatexArtifactSeedRevealProgress(plan, 0.5), 0.5);
  assert.equal(sampleKatexArtifactSeedRevealProgress(plan, 0.8), 1);
  assert.equal(sampleKatexArtifactSeedRevealProgress(plan, 1), 1);

  const forward = sampleKatexArtifactSeedRevealProgress(plan, 0.35);
  const backward = sampleKatexArtifactSeedRevealProgress(plan, 0.65);

  assert.equal(forward, 0.25);
  assert.equal(backward, 0.75);
  assert.equal(1 - forward, backward);
});

test("createKatexArtifactSeedRevealFrame contracts source into a seed and reveals the target from that seed", () => {
  const plan = seedRevealPlan({});
  const regions = new Map<string, KatexAtlasRegion>([
    ["source-artifact", regionFor("source-artifact")],
    ["target-artifact", regionFor("target-artifact")]
  ]);
  const start = createKatexArtifactSeedRevealFrame(plan, regions, 0);
  const contracted = createKatexArtifactSeedRevealFrame(plan, regions, 0.55);
  const vanished = createKatexArtifactSeedRevealFrame(plan, regions, 0.6);
  const revealing = createKatexArtifactSeedRevealFrame(plan, regions, 0.79);
  const finished = createKatexArtifactSeedRevealFrame(plan, regions, 1);

  assert.deepEqual(
    start.quads.map((quad) => [quad.tokenId, quad.rect, quad.opacity]),
    [
      [
        "source-artifact",
        { left: 10, top: 20, width: 30, height: 12 },
        1
      ]
    ]
  );
  assert.deepEqual(contracted.quads[0]?.rect, {
    left: 32,
    top: 24,
    width: 1,
    height: 1
  });
  assert.ok((contracted.quads[0]?.opacity ?? 0) > 0);
  assert.deepEqual(
    vanished.quads.map((quad) => quad.tokenId),
    ["target-artifact"]
  );
  assert.ok((revealing.quads[0]?.rect.width ?? 0) > 1);
  assert.ok((revealing.quads[0]?.rect.width ?? 0) < 36);
  assert.ok((revealing.quads[0]?.opacity ?? 0) > 0);
  assert.deepEqual(finished.quads[0]?.rect, {
    left: 50,
    top: 18,
    width: 36,
    height: 16
  });
  assert.equal(finished.quads[0]?.opacity, 1);
});

function seedRevealPlan(overrides: {
  readonly start?: number | undefined;
  readonly end?: number | undefined;
}) {
  return {
    id: "radical-artifact-seed-reveal",
    kind: "artifact-seed-reveal" as const,
    source: {
      tokenId: "source-artifact",
      rect: { left: 10, top: 20, width: 30, height: 12 }
    },
    target: {
      tokenId: "target-artifact",
      rect: { left: 50, top: 18, width: 36, height: 16 }
    },
    seedRect: { left: 32, top: 24, width: 1, height: 1 },
    sourceMotion: {
      kind: "contract-to-seed" as const,
      contractEnd: 0.55,
      fadeStart: 0.56,
      fadeEnd: 0.6
    },
    targetMotion: {
      kind: "reveal-from-seed" as const,
      revealStart: 0.58,
      revealEnd: 1
    },
    start: overrides.start ?? 0,
    end: overrides.end ?? 1,
    easing: "linear" as const
  };
}

function regionFor(tokenId: string): KatexAtlasRegion {
  return {
    tokenId,
    page: 0,
    x: 0,
    y: 0,
    width: 12,
    height: 10,
    u0: 0,
    v0: 0,
    u1: 0.25,
    v1: 0.5
  };
}
