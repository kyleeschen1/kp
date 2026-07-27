import assert from "node:assert/strict";
import test from "node:test";

import {
  kpFoldableDistributionPreservationManifest as manifest
} from "../src/reader/compiler/foldable-distribution-preservation-manifest.ts";

test("foldable distribution manifest freezes the exact expression chain", () => {
  assert.deepEqual(
    manifest.expressionChain.map(({ latex }) => latex),
    [
      "3(x + 2) + 2(x - 1)",
      "3x + 6 + 2x - 2",
      "(3x + 2x) + (6 - 2)",
      "5x + 4"
    ]
  );
  assert.equal(
    new Set(manifest.expressionChain.map(({ id }) => id)).size,
    manifest.expressionChain.length
  );
});

test("foldable distribution manifest requires semantic motifs instead of fades", () => {
  assert.deepEqual(
    manifest.visualPhases.map(({ requiredMotif }) => requiredMotif),
    [
      "copy-fan-out",
      "successor-synthesis",
      "semantic-reorder-and-group",
      "merge-fan-in"
    ]
  );
  assert.ok(
    manifest.visualPhases.every(
      ({ opacityPolicy }) => opacityPolicy === "opaque-lineage"
    )
  );
  assert.equal(
    manifest.paintContract.structuralFissionFusionOpacity,
    "opaque-throughout"
  );
  assert.deepEqual(manifest.paintContract.forbiddenPolicies, [
    "whole-equation-fade-replacement",
    "source-out-target-in-crossfade",
    "fading-structural-fission-fusion",
    "simultaneous-legacy-and-canonical-paint",
    "non-native-endpoint-settlement"
  ]);
});

test("foldable distribution manifest freezes reference and review coverage", () => {
  assert.deepEqual(
    manifest.canonicalReferences.map(({ route }) => route),
    [
      "/reader/distribution-area/",
      "/reader/split-merge-fractions/",
      "/reader/radical-succession/",
      "/reader/solve-x/",
      "/canonical-animation-review.html"
    ]
  );
  assert.deepEqual(manifest.presentation.reviewViewports, [
    { width: 1_100, height: 800, deviceScaleFactor: 1 },
    { width: 390, height: 844, deviceScaleFactor: 1 },
    { width: 1_100, height: 800, deviceScaleFactor: 2 },
    { width: 390, height: 844, deviceScaleFactor: 2 }
  ]);
  assert.deepEqual(manifest.foldContract.modes, [
    "expanded",
    "collapsed",
    "automatic",
    "pinned"
  ]);
});

test("foldable distribution manifest freezes architecture and product boundaries", () => {
  assert.deepEqual(manifest.preservationBoundary, {
    runtimeClockCount: 1,
    canonicalRendererSessionCount: 1,
    structuralWebglLeaseLimit: 1,
    compositorCoreFrozen: true,
    lifecycleVocabularyFrozen: true,
    schedulerVocabularyFrozen: true,
    operationSpecificGeometryAllowed: false,
    existingCanonicalReadersMustRemainUnchanged: true
  });
  assert.equal(manifest.paintContract.nativeEndpointAuthority, "native-katex");
  assert.equal(manifest.accessibility.semanticDomOwner, "reader");
  assert.equal(manifest.accessibility.collapsedWorkDisclosed, true);
});
