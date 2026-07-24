import assert from "node:assert/strict";
import test from "node:test";

import {
  kpAnimationAssetProjectionFieldOwnership,
  projectKpAnimationAsset,
  recomposeKpAnimationAsset
} from "../src/animation/asset-projections.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";

test("narrow projections partition every aggregate asset field exactly once", () => {
  const aggregateFields = Object.keys(createLinearSolveAnimationAsset()).sort();
  const projectedFields = Object.values(
    kpAnimationAssetProjectionFieldOwnership
  ).flat().sort();

  assert.deepEqual(projectedFields, aggregateFields);
  assert.equal(new Set(projectedFields).size, projectedFields.length);
});

test("all projections share one immutable identity authority", () => {
  const projections = projectKpAnimationAsset(
    createLinearSolveAnimationAsset()
  );

  assert.strictEqual(projections.semanticAnimation.identity, projections.identity);
  assert.strictEqual(projections.presentation.identity, projections.identity);
  assert.strictEqual(projections.productManifest.identity, projections.identity);
  assert.equal(Object.isFrozen(projections), true);
  assert.equal(Object.isFrozen(projections.identity), true);
  assert.equal(Object.isFrozen(projections.semanticAnimation), true);
});

test("projections retain source authorities rather than copying their state", () => {
  const asset = createLinearSolveAnimationAsset();
  const projections = projectKpAnimationAsset(asset);

  assert.strictEqual(projections.semanticAnimation.bundle, asset.bundle);
  assert.strictEqual(
    projections.semanticAnimation.transformations,
    asset.transformations
  );
  assert.strictEqual(
    projections.semanticAnimation.transformationTree,
    asset.transformationTree
  );
  assert.strictEqual(
    projections.semanticAnimation.renderTargets,
    asset.renderTargets
  );
  assert.strictEqual(
    projections.productManifest.exportTargets,
    asset.exportTargets
  );
});

test("projection recomposition preserves version 1 serialization exactly", () => {
  const asset = createLinearSolveAnimationAsset();
  const recomposed = recomposeKpAnimationAsset(projectKpAnimationAsset(asset));

  assert.deepEqual(recomposed, asset);
  assert.equal(JSON.stringify(recomposed), JSON.stringify(asset));
});

test("projection recomposition rejects independently forged identities", () => {
  const projections = projectKpAnimationAsset(
    createLinearSolveAnimationAsset()
  );

  assert.throws(
    () => recomposeKpAnimationAsset({
      ...projections,
      presentation: {
        ...projections.presentation,
        identity: { ...projections.identity }
      }
    }),
    /share one identity/
  );
});
