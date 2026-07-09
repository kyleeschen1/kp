import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKatexArtifactTextureBlendFrame,
  createKatexArtifactTextureBlendTransitionPlan,
  sampleKatexArtifactTextureBlendProgress
} from "../src/rendering/katex-artifact-texture-blend.ts";
import type { KatexAtlasRegion } from "../src/rendering/katex-transition-types.ts";

test("sampleKatexArtifactTextureBlendProgress maps global progress into a reversible beat", () => {
  const plan = textureBlendPlan({ start: 0.2, end: 0.8 });

  assert.equal(sampleKatexArtifactTextureBlendProgress(plan, 0), 0);
  assert.equal(sampleKatexArtifactTextureBlendProgress(plan, 0.2), 0);
  assert.equal(sampleKatexArtifactTextureBlendProgress(plan, 0.5), 0.5);
  assert.equal(sampleKatexArtifactTextureBlendProgress(plan, 0.8), 1);
  assert.equal(sampleKatexArtifactTextureBlendProgress(plan, 1), 1);

  const forward = sampleKatexArtifactTextureBlendProgress(plan, 0.35);
  const backward = sampleKatexArtifactTextureBlendProgress(plan, 0.65);

  assert.equal(forward, 0.25);
  assert.equal(backward, 0.75);
  assert.equal(1 - forward, backward);
});

test("createKatexArtifactTextureBlendFrame fades source and target artifact regions", () => {
  const plan = textureBlendPlan({ start: 0.2, end: 0.8 });
  const frame = createKatexArtifactTextureBlendFrame(
    plan,
    new Map([
      ["source-artifact", regionFor("source-artifact")],
      ["target-artifact", regionFor("target-artifact")]
    ]),
    0.5
  );

  assert.deepEqual(
    frame.quads.map((quad) => [quad.tokenId, quad.rect, quad.opacity]),
    [
      [
        "source-artifact",
        { left: 10, top: 20, width: 30, height: 12 },
        0.5
      ],
      [
        "target-artifact",
        { left: 14, top: 18, width: 36, height: 16 },
        0.5
      ]
    ]
  );
});

test("createKatexArtifactTextureBlendFrame skips artifacts without atlas regions", () => {
  const frame = createKatexArtifactTextureBlendFrame(
    textureBlendPlan({}),
    new Map([["target-artifact", regionFor("target-artifact")]]),
    0.5
  );

  assert.deepEqual(
    frame.quads.map((quad) => quad.tokenId),
    ["target-artifact"]
  );
});

test("createKatexArtifactTextureBlendTransitionPlan exposes source-only and target-only quads to the WebGL renderer", () => {
  const transitionPlan = createKatexArtifactTextureBlendTransitionPlan(
    textureBlendPlan({})
  );

  assert.deepEqual(
    transitionPlan.sourceOnly.map((entry) => [
      entry.source.id,
      entry.source.localRect
    ]),
    [["source-artifact", { left: 10, top: 20, width: 30, height: 12 }]]
  );
  assert.deepEqual(
    transitionPlan.targetOnly.map((entry) => [
      entry.target.id,
      entry.target.localRect
    ]),
    [["target-artifact", { left: 14, top: 18, width: 36, height: 16 }]]
  );
});

function textureBlendPlan(overrides: {
  readonly start?: number | undefined;
  readonly end?: number | undefined;
}) {
  return {
    id: "radical-artifact-blend",
    kind: "artifact-texture-blend" as const,
    source: {
      tokenId: "source-artifact",
      rect: { left: 10, top: 20, width: 30, height: 12 }
    },
    target: {
      tokenId: "target-artifact",
      rect: { left: 14, top: 18, width: 36, height: 16 }
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
