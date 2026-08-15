import assert from "node:assert/strict";
import test from "node:test";

import generatedMatrix from
  "../src/architecture/equation-surface-preservation-matrix.generated.json" with {
    type: "json"
  };
import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  compileKpEquationSurfacePreservationMatrix,
  createKpEquationSurfacePreservationMatrix,
  KpEquationSurfacePreservationMatrixError
} from "../src/architecture/equation-surface-preservation-matrix.ts";
import {
  createKpEquationSurfaceInventory
} from "../src/architecture/equation-surface-inventory.ts";

test("preservation matrix freezes every current equation endpoint", () => {
  const matrix = createKpEquationSurfacePreservationMatrix();

  assert.deepEqual(generatedMatrix, matrix);
  assert.equal(matrix.entries.length, 28);
  assert.equal(matrix.families.length, 14);
  assert.equal(
    matrix.entries.every((entry) =>
      entry.semanticEndpoints.length > 0 &&
      entry.semanticEndpoints.every((endpoint) =>
        endpoint.source.length > 0 &&
        endpoint.target.length > 0 &&
        endpoint.source.every(({ semanticFingerprint }) =>
          /^fnv1a32-[0-9a-f]{8}$/.test(semanticFingerprint)) &&
        endpoint.target.every(({ semanticFingerprint }) =>
          /^fnv1a32-[0-9a-f]{8}$/.test(semanticFingerprint))
      )
    ),
    true
  );
});

test("every equation family has semantic, visual, and uniform browser evidence", () => {
  const matrix = createKpEquationSurfacePreservationMatrix();
  const matrixIds = new Set(matrix.entries.map(({ animationId }) => animationId));

  assert.deepEqual(
    new Set(matrix.families.flatMap(({ animationIds }) => animationIds)),
    matrixIds
  );
  for (const family of matrix.families) {
    assert.equal(family.animationIds.includes(
      family.representativeAnimationId
    ), true);
    assert.match(family.semanticVerificationCommand, /^npm run /);
    assert.match(family.visualVerificationCommand, /^npm run visual:/);
    assert.equal(
      family.uniformBrowserVerificationCommand,
      "npm run test:browser:equation-surface-preservation"
    );
  }
});

test("preservation matrix rejects missing, duplicate, and broken endpoints", () => {
  const inventory = createKpEquationSurfaceInventory();
  const assets = createKpAnimationAssets();
  const missingId = inventory.entries[0]!.animationId;
  const first = assets.find(({ id }) => id === missingId)!;

  assert.throws(
    () => compileKpEquationSurfacePreservationMatrix({
      inventory,
      assets: assets.filter(({ id }) => id !== missingId)
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfacePreservationMatrixError &&
      error.diagnostics.some((message) =>
        message.includes(`Missing preservation asset ${missingId}`))
  );
  assert.throws(
    () => compileKpEquationSurfacePreservationMatrix({
      inventory,
      assets: [...assets, first]
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfacePreservationMatrixError &&
      error.diagnostics.some((message) =>
        message.includes(`Duplicate preservation asset id ${missingId}`))
  );
  const broken = {
    ...first,
    transformations: [{
      ...first.transformations[0]!,
      sourceObjectIds: ["missing.semantic.endpoint"]
    }]
  };
  assert.throws(
    () => compileKpEquationSurfacePreservationMatrix({
      inventory,
      assets: assets.map((asset) => asset.id === missingId ? broken : asset)
    }),
    (error: unknown) =>
      error instanceof KpEquationSurfacePreservationMatrixError &&
      error.diagnostics.some((message) =>
        message.includes("missing endpoint object missing.semantic.endpoint"))
  );
});
