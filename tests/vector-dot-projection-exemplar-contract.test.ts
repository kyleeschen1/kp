import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { createDotProjectionAnimationAsset } from
  "../src/animation/dot-projection-adapter.ts";
import {
  kpVectorDotProjectionExemplarContract
} from "../src/animation/vector-dot-projection-exemplar-contract.ts";
import {
  kpVectorDotProjectionCurrentBaseline,
  kpVectorDotProjectionPreservationBoundary,
  kpVectorDotProjectionReferenceInventory,
  kpVectorDotProjectionVisualAcceptance
} from "../src/architecture/vector-dot-projection-exemplar-inventory.ts";
import {
  createKpDimensionalContinuityGraphPresentationProfile
} from "../src/rendering/dimensional-continuity-graph-profile.ts";
import { parseKpPromotionLedger } from
  "../scripts/check-animation-promotion-memory.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("rank 5 remains the unpromoted vector dot-projection frontier", () => {
  const ledger = parseKpPromotionLedger(readFileSync(
    join(projectRoot, "docs/project/threads/animation-library-promotion.md"),
    "utf8"
  ));
  const current = ledger.find(({ rank }) => rank === 5);

  assert.deepEqual(current, {
    rank: 5,
    stableId: "kp.promotion.vector-dot-projection",
    canonicalExemplar: "Project one vector onto another",
    referenceKey: "Project one vector onto another",
    status: "next"
  });
  assert.equal(ledger.filter(({ status }) => status === "next").length, 1);
});

test("the exact non-axis-aligned story closes every vector law", () => {
  const story = kpVectorDotProjectionExemplarContract;
  const dot = story.sourceVector[0] * story.targetVector[0] +
    story.sourceVector[1] * story.targetVector[1];
  const targetNormSquared = story.targetVector[0] ** 2 +
    story.targetVector[1] ** 2;
  const projected = story.targetVector.map((value) =>
    value * story.projectionScale.value
  );
  const residual = story.sourceVector.map((value, index) =>
    value - projected[index]!
  );

  assert.equal(dot, story.dotProduct);
  assert.equal(targetNormSquared, story.targetNormSquared);
  assert.equal(
    story.projectionScale.numerator / story.projectionScale.denominator,
    story.projectionScale.value
  );
  assert.deepEqual(projected, story.projectionVector);
  assert.deepEqual(residual, story.residualVector);
  assert.equal(
    residual[0]! * story.targetVector[0] +
      residual[1]! * story.targetVector[1],
    story.residualTargetDotProduct
  );
  assert.deepEqual(
    story.componentPairs.map(({ index, product, cumulativeDotProduct }) =>
      [index, product, cumulativeDotProduct]
    ),
    [[0, 4, 4], [1, 2, 6]]
  );
});

test("current implementation baseline and every reference are explicit", () => {
  const animation = createDotProjectionAnimationAsset();
  const vectors = animation.bundle.objects
    .filter(({ objectType }) => objectType === "vector")
    .map(({ value }) => (value as { coordinates: readonly number[] }).coordinates);

  assert.equal(animation.id, kpVectorDotProjectionCurrentBaseline.animationId);
  assert.deepEqual(vectors.slice(0, 2), [
    kpVectorDotProjectionCurrentBaseline.sourceVector,
    kpVectorDotProjectionCurrentBaseline.targetVector
  ]);
  assert.equal(kpVectorDotProjectionCurrentBaseline.knownPresentationGaps.length, 5);
  for (const reference of kpVectorDotProjectionReferenceInventory) {
    assert.equal(existsSync(join(projectRoot, reference.path)), true, reference.path);
    assert.ok(reference.role.length > 45, reference.path);
  }
});

test("visual obligations reuse the promoted graph language without a new engine", () => {
  const profile = createKpDimensionalContinuityGraphPresentationProfile(
    "linear-algebra"
  );
  assert.equal(profile.languageId, kpVectorDotProjectionExemplarContract.graphLanguageId);
  assert.equal(profile.renderer, "svg");
  assert.equal(profile.projection, "orthographic-xy");
  assert.equal(profile.mathTypography, "katex");
  assert.ok(kpVectorDotProjectionVisualAcceptance.some((criterion) =>
    criterion.includes("indexed x then y component pairing")
  ));
  assert.ok(kpVectorDotProjectionVisualAcceptance.some((criterion) =>
    criterion.includes("no WebGL request")
  ));
  assert.ok(kpVectorDotProjectionPreservationBoundary.some((criterion) =>
    criterion.includes("rank-5 next status")
  ));
});
