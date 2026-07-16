import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpMaterialContinuityQuality
} from "../src/animation/material-continuity-quality.ts";

test("material continuity quality accepts stable boundaries and shared bundles", () => {
  assert.deepEqual(
    evaluateKpMaterialContinuityQuality({
      boundaries: [{
        id: "boundary.solve.one-two",
        stableOwnershipRequired: true,
        beforeOwnerId: "material.x",
        afterOwnerId: "material.x",
        before: {
          x: 10,
          y: 20,
          velocityX: 0,
          velocityY: 0,
          attention: 0.2
        },
        after: {
          x: 10.2,
          y: 20.1,
          velocityX: 0.3,
          velocityY: 0,
          attention: 0.18
        }
      }],
      reconciliations: [{
        id: "bundle.root",
        sourceBundlePoint: { x: 30, y: 40 },
        targetBundlePoint: { x: 30.2, y: 40.1 },
        residualTransformPx: 0,
        structuralScaleAlong: 1,
        structuralScaleAcross: 1
      }]
    }),
    []
  );
});

test("material continuity quality identifies current false-positive classes", () => {
  const violations = evaluateKpMaterialContinuityQuality({
    boundaries: [{
      id: "boundary.solve.owner-swap",
      stableOwnershipRequired: true,
      beforeOwnerId: "source.x",
      afterOwnerId: "target.x",
      before: {
        x: 0,
        y: 0,
        velocityX: 4,
        velocityY: 0,
        attention: 0
      },
      after: {
        x: 2,
        y: 0,
        velocityX: 0,
        velocityY: 0,
        attention: 0
      }
    }],
    reconciliations: [{
      id: "bundle.radical.disconnected",
      sourceBundlePoint: { x: 0, y: 0 },
      targetBundlePoint: { x: 8, y: 5 },
      residualTransformPx: 1,
      structuralScaleAlong: 1.03,
      structuralScaleAcross: 0.98
    }]
  });

  assert.deepEqual(
    new Set(violations.map((violation) => violation.lawId)),
    new Set([
      "material-continuity.stable-owner",
      "material-continuity.boundary-displacement",
      "material-continuity.boundary-velocity",
      "material-continuity.attention-floor",
      "material-continuity.bundle-convergence",
      "material-continuity.native-settlement",
      "material-continuity.structural-deformation"
    ])
  );
});
