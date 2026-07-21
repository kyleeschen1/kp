import assert from "node:assert/strict";
import test from "node:test";

import { sampleKpEquationMaterialOwnerHandoff } from "../src/rendering/equation-material-owner.ts";
import { checkKpEquationNativeEndpointLaw } from "../src/rendering/equation-native-endpoint-law.ts";

const sourceBounds = { left: 20, top: 10, width: 18, height: 24 };
const targetBounds = { left: 90, top: 10, width: 18, height: 24 };

test("native endpoint law requires exact authority and coincident geometry", () => {
  const source = checkKpEquationNativeEndpointLaw({
    endpoint: "source",
    nativePresent: true,
    handoff: sampleKpEquationMaterialOwnerHandoff({
      ownerId: "owner.x",
      progress: 0,
      sourcePresent: true,
      targetPresent: true
    }),
    nativeBounds: sourceBounds,
    materialBounds: sourceBounds
  });
  const target = checkKpEquationNativeEndpointLaw({
    endpoint: "target",
    nativePresent: true,
    handoff: sampleKpEquationMaterialOwnerHandoff({
      ownerId: "owner.x",
      progress: 1,
      sourcePresent: true,
      targetPresent: true
    }),
    nativeBounds: targetBounds,
    materialBounds: targetBounds
  });

  assert.deepEqual(source.failures, []);
  assert.equal(source.authorityTotal, 1);
  assert.equal(source.maximumGeometryResidualPx, 0);
  assert.equal(target.passed, true);
});

test("native endpoint law distinguishes ownership and geometry failures", () => {
  const geometry = checkKpEquationNativeEndpointLaw({
    endpoint: "target",
    nativePresent: true,
    handoff: sampleKpEquationMaterialOwnerHandoff({
      ownerId: "owner.equals",
      progress: 1,
      sourcePresent: true,
      targetPresent: true
    }),
    nativeBounds: targetBounds,
    materialBounds: { ...targetBounds, left: targetBounds.left + 3 }
  });
  assert.deepEqual(geometry.failures.map(({ code }) => code), [
    "geometry-discontinuity"
  ]);
  assert.equal(geometry.maximumGeometryResidualPx, 3);

  const wrongEndpoint = checkKpEquationNativeEndpointLaw({
    endpoint: "target",
    nativePresent: true,
    handoff: sampleKpEquationMaterialOwnerHandoff({
      ownerId: "owner.equals",
      progress: 0.96,
      sourcePresent: true,
      targetPresent: true
    }),
    nativeBounds: targetBounds,
    materialBounds: targetBounds
  });
  assert.deepEqual(wrongEndpoint.failures.map(({ code }) => code), [
    "non-exact-endpoint",
    "native-authority",
    "material-release"
  ]);
});

test("absent native endpoints require zero visual authority but no geometry", () => {
  const result = checkKpEquationNativeEndpointLaw({
    endpoint: "source",
    nativePresent: false,
    handoff: sampleKpEquationMaterialOwnerHandoff({
      ownerId: "owner.result-four",
      progress: 0,
      sourcePresent: false,
      targetPresent: true
    })
  });

  assert.equal(result.passed, true);
  assert.equal(result.authorityTotal, 0);
  assert.equal(result.maximumGeometryResidualPx, undefined);
});
