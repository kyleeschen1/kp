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

test("createKatexArtifactSeedRevealFrame folds texture pieces into a visible bundle and resolves them asynchronously", () => {
  const plan = seedRevealPlan({});
  const regions = new Map<string, KatexAtlasRegion>([
    ["source-artifact", regionFor("source-artifact")],
    ["target-artifact", regionFor("target-artifact")]
  ]);
  const start = createKatexArtifactSeedRevealFrame(plan, regions, 0);
  const earlyDissolve = createKatexArtifactSeedRevealFrame(plan, regions, 0.2);
  const gathering = createKatexArtifactSeedRevealFrame(plan, regions, 0.4);
  const bundled = createKatexArtifactSeedRevealFrame(plan, regions, 0.56);
  const resolving = createKatexArtifactSeedRevealFrame(plan, regions, 0.72);
  const finished = createKatexArtifactSeedRevealFrame(plan, regions, 1);

  assert.equal(start.pieces.length, 8);
  assert.ok(start.pieces.every((piece) => piece.tokenId === "source-artifact"));
  assert.ok(
    start.pieces.some((piece) => piece.rect.left !== start.pieces[0]?.rect.left)
  );
  assert.ok(
    earlyDissolve.pieces.some(
      (piece) =>
        piece.tokenId === "target-artifact" &&
        piece.motion === "dissolve" &&
        piece.opacity > 0 &&
        piece.opacity < 1
    )
  );
  assert.ok(
    gathering.pieces.some((piece) => piece.tokenId === "source-artifact")
  );
  assert.ok(
    gathering.pieces
      .filter(
        (piece) =>
          piece.tokenId === "source-artifact" &&
          !rectIsInside(piece.rect, plan.bundleRect)
      )
      .every((piece) => piece.opacity === 1)
  );
  assert.ok(
    resolving.pieces.some(
      (piece) =>
        piece.tokenId === "source-artifact" &&
        piece.motion === "collapse" &&
        rectIsInside(piece.rect, plan.bundleRect) &&
        piece.opacity > 0 &&
        piece.opacity < 1
    )
  );
  assert.ok(
    new Set(
      gathering.pieces
        .filter((piece) => piece.tokenId === "source-artifact")
        .map((piece) => Math.round(piece.rect.left * 10) / 10)
    ).size > 2
  );
  assert.ok(
    bundled.pieces.filter(
      (piece) =>
        piece.rect.left >= 32 &&
        piece.rect.left + piece.rect.width <= 42 &&
        piece.rect.top >= 22 &&
        piece.rect.top + piece.rect.height <= 30
    ).length > 0
  );
  assert.ok(
    resolving.pieces.some(
      (piece) =>
        piece.tokenId === "target-artifact" && piece.motion === "dissolve"
    )
  );
  assert.ok(
    resolving.pieces.some(
      (piece) => piece.tokenId === "target-artifact" && piece.motion === "fold"
    )
  );
  assert.ok(
    resolving.pieces.some(
      (piece) => piece.tokenId === "target-artifact" && piece.opacity < 1
    )
  );
  assert.equal(finished.pieces.length, 16);
  assert.ok(finished.pieces.every((piece) => piece.tokenId === "target-artifact"));
  assert.ok(finished.pieces.every((piece) => piece.opacity === 1));
  assert.ok(
    new Set(finished.pieces.map((piece) => piece.rect.left)).size > 4
  );
});

function rectIsInside(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}, bounds: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): boolean {
  return (
    rect.left >= bounds.left &&
    rect.left + rect.width <= bounds.left + bounds.width &&
    rect.top >= bounds.top &&
    rect.top + rect.height <= bounds.top + bounds.height
  );
}

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
    bundleRect: { left: 32, top: 22, width: 10, height: 8 },
    sourceGrid: { columns: 4, rows: 2 },
    targetGrid: { columns: 8, rows: 2 },
    sourceMotion: {
      kind: "collapse-to-bundle" as const,
      collapseEnd: 0.48,
      fadeStart: 0.34,
      fadeEnd: 0.56,
      stagger: 0.08,
      drift: 1.5
    },
    targetMotion: {
      kind: "unfold-from-bundle" as const,
      revealStart: 0.42,
      revealEnd: 1,
      stagger: 0.18,
      drift: 1.25,
      dissolveFraction: 0.25
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
