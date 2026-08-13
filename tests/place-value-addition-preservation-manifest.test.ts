import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpPlaceValueAdditionPreservationManifest as manifest
} from "../src/reader/compiler/place-value-addition-preservation-manifest.ts";

test("place-value inventory freezes one canonical stacked calculation", () => {
  assert.equal(manifest.canonicalExpression, "278 + 156 = 434");
  assert.deepEqual(manifest.primaryProjection.addends, [278, 156]);
  assert.equal(
    manifest.primaryProjection.operatorPlacement,
    "left-of-second-addend"
  );
  assert.equal(
    manifest.primaryProjection.underlinePlacement,
    "beneath-second-addend"
  );
  assert.equal(
    manifest.primaryProjection.alignment,
    "right-aligned-place-columns"
  );
  assert.equal(manifest.primaryProjection.carryPlacement, "above-next-column");
  assert.equal(manifest.secondaryProjection.authority, "projection-only");
  assert.equal(manifest.secondaryProjection.mayReplacePrimary, false);
});

test("place-value inventory resolves every existing authority exactly once", () => {
  const concerns = manifest.existingAuthorities.map(({ concern }) => concern);
  assert.equal(new Set(concerns).size, concerns.length);
  for (const authority of manifest.existingAuthorities) {
    assert.ok(
      readFileSync(authority.path, "utf8").length > 0,
      `${authority.concern} must resolve ${authority.path}`
    );
  }
  assert.deepEqual(
    manifest.existingAuthorities
      .filter(({ disposition }) => disposition === "reuse-unchanged")
      .map(({ concern }) => concern),
    [
      "identity-fission-program",
      "identity-fusion-program",
      "motif-continuity-compiler",
      "canonical-session",
      "native-scene-compositor",
      "review-capture"
    ]
  );
});

test("place-value inventory freezes protected core bytes before implementation", () => {
  assert.equal(manifest.baselineCommit, "5f688d34");
  assert.equal(manifest.protectedCoreDigests.length, 10);
  for (const protectedFile of manifest.protectedCoreDigests) {
    const digest = createHash("sha256")
      .update(readFileSync(protectedFile.path))
      .digest("hex");
    assert.equal(
      digest,
      protectedFile.sha256,
      `${protectedFile.path} changed inside a compositor-frozen content loop`
    );
  }
});

test("place-value cost boundary permits no parallel animation infrastructure", () => {
  assert.deepEqual(manifest.costBoundary, {
    canonicalRuntimeCount: 1,
    canonicalClockCount: 1,
    maximumNewRendererCategories: 0,
    maximumNewCompositorCategories: 0,
    maximumNewLifecycleCategories: 0,
    maximumNewSchedulerCategories: 0,
    maximumNewDisplayPages: 0,
    maximumNewWebglLeases: 0,
    operationSpecificGeometryAllowed: false,
    viewportSpecificMotionAllowed: false,
    genericFadeFallbackAllowed: false
  });
  assert.equal(
    manifest.preservationBoundary.nativeEndpointAuthority,
    "native-katex"
  );
  assert.equal(
    manifest.preservationBoundary.reviewCaptureOwner,
    "existing-animation-library"
  );
});
