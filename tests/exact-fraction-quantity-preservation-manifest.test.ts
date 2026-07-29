import assert from "node:assert/strict";
import test from "node:test";

import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";

test("exact fraction exemplar freezes five ordered checkpoints and beats", () => {
  assert.equal(manifest.canonicalExpression, "1/3 + 1/6 = 1/2");
  assert.equal(manifest.checkpoints.length, 5);
  assert.equal(manifest.pacing.length, 5);
  assert.deepEqual(
    manifest.checkpoints.map(({ beatId }) => beatId),
    manifest.pacing.map(({ beatId }) => beatId)
  );
  assert.deepEqual(
    manifest.checkpoints.map(({ progressPermille }) => progressPermille),
    [180, 400, 560, 820, 1_000]
  );
  assert.equal(manifest.pacing[0]?.startPermille, 0);
  assert.equal(manifest.pacing.at(-1)?.endPermille, 1_000);
  assert.deepEqual(
    manifest.checkpoints.map(({ progressPermille }) => progressPermille),
    manifest.pacing.map(({ endPermille }) => endPermille)
  );
  assert.ok(manifest.pacing.every((beat, index) =>
    index === 0 ||
    manifest.pacing[index - 1]?.endPermille === beat.startPermille
  ));
});

test("both addends and their result name atomic parts of one exact unit", () => {
  const third = manifest.selections.oneThird.atomicPartIds;
  const sixth = manifest.selections.oneSixth.atomicPartIds;
  const result = manifest.selections.resultHalf.atomicPartIds;

  assert.equal(manifest.exactUnit.convention, "same-unit-addends");
  assert.equal(manifest.exactUnit.canonicalPartitionDenominator, 6);
  assert.equal(new Set(manifest.atomicPartIds).size, 6);
  assert.deepEqual([...new Set([...third, ...sixth])], result);
  assert.ok(
    result.every((partId) => manifest.atomicPartIds.includes(partId))
  );
});

test("the reference requires all four views without making one authoritative", () => {
  assert.deepEqual(manifest.viewObligations, [
    "symbolic",
    "partitioned-circle",
    "fraction-bar",
    "number-line"
  ]);
  assert.equal(
    manifest.authorityContract.mathematics,
    "verified-exact-quantity-trace"
  );
  assert.ok(
    manifest.authorityContract.forbiddenAuthorities.includes(
      "renderer-owned-arithmetic"
    )
  );
  assert.ok(
    manifest.authorityContract.forbiddenAuthorities.includes(
      "geometry-derived-identity"
    )
  );
});

test("persistent, fission, and fusion identities cannot use opacity", () => {
  assert.equal(
    manifest.identityContract.persistentPartOpacity,
    "opaque-throughout"
  );
  assert.equal(
    manifest.identityContract.fissionOpacity,
    "opaque-throughout"
  );
  assert.equal(
    manifest.identityContract.fusionOpacity,
    "opaque-throughout"
  );
  assert.ok(
    manifest.identityContract.forbiddenChoreography.includes(
      "source-out-target-in-crossfade"
    )
  );
});

test("folding and responsive focus preserve semantic truth and architecture", () => {
  assert.deepEqual(manifest.foldContract.modes, [
    "expanded",
    "collapsed",
    "automatic",
    "pinned"
  ]);
  assert.equal(
    manifest.presentation.phonePolicy,
    "deterministic-active-view-focus"
  );
  assert.deepEqual(manifest.preservationBoundary, {
    addendUnitIdsMustMatch: true,
    exactValuesMustNormalize: true,
    selectedPartProvenanceMustClose: true,
    requiredViewCount: 4,
    compositorCoreFrozen: true,
    lifecycleVocabularyFrozen: true,
    schedulerVocabularyFrozen: true,
    displayPageCountMayIncrease: false,
    webglLeaseCountMayIncrease: false,
    operationSpecificGeometryAllowed: false,
    existingCanonicalReadersMustRemainUnchanged: true
  });
});
