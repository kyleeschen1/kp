import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExactFractionQuantityAnimationAsset
} from "../src/animation/exact-fraction-quantity-adapter.ts";
import {
  settleKpExactFractionQuantityAccessibilityProgress
} from "../src/animation/exact-fraction-quantity-accessibility-sampling.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityAccessibleProjection
} from "../src/rendering/exact-fraction-quantity-accessible-projection.ts";
import {
  createKpExactFractionQuantityStaticStepExport
} from "../src/tutorial/exact-fraction-quantity-static-step-export.ts";

test("accessible projection covers every exact operation exactly once", () => {
  const projection = createKpExactFractionQuantityAccessibleProjection();

  assert.equal(projection.foldInvariant, true);
  assert.equal(projection.viewInvariant, true);
  assert.deepEqual(
    projection.steps.map(({ checkpointId }) => checkpointId),
    manifest.checkpoints.map(({ id }) => id)
  );
  assert.deepEqual(
    projection.steps.map(({ beatId }) => beatId),
    manifest.checkpoints.map(({ beatId }) => beatId)
  );
  assert.ok(projection.steps.every(
    ({ accessibleMath, nativeHtmlAndMathml, description }) =>
      accessibleMath.length > 0 &&
      description.length > 0 &&
      nativeHtmlAndMathml.includes(
        '<math xmlns="http://www.w3.org/1998/Math/MathML"'
      )
  ));
});

test("static export renders five serializable four-view truths", () => {
  const animation = createKpExactFractionQuantityAnimationAsset();
  const sequence = createKpExactFractionQuantityStaticStepExport();

  assert.deepEqual(sequence.diagnostics, []);
  assert.equal(
    sequence.artifact.id,
    animation.exportTargets.find(({ kind }) => kind === "static-step")
      ?.artifactId
  );
  assert.deepEqual(
    sequence.steps.map(({ progress }) => progress),
    manifest.checkpoints.map(
      ({ progressPermille }) => progressPermille / 1_000
    )
  );
  assert.deepEqual(
    sequence.steps.map(({ frame }) =>
      frame.completedOperationIds.length
    ),
    [1, 2, 3, 4, 5]
  );
  for (const { frame, markers } of sequence.steps) {
    assert.equal(
      Object.keys(frame.representations).length,
      manifest.viewObligations.length
    );
    assert.equal(
      markers?.length,
      frame.focusSelectionIds.length
    );
    assert.deepEqual(
      frame.semanticTruth.operationIds,
      manifest.checkpoints.map(({ beatId }) => beatId)
    );
    assert.equal("foldMode" in frame, false);
    assert.equal("activeView" in frame, false);
  }
  const serialized = JSON.stringify(sequence);
  assert.match(serialized, /<math xmlns=\\"http:\/\/www\.w3\.org/);
  assert.equal((serialized.match(/role=\\"img\\"/gu) ?? []).length, 15);
  assert.doesNotMatch(serialized, /fade|opacity/iu);
});

test("reduced, static, and narrated sampling can only settle endpoints", () => {
  const endpoints = manifest.checkpoints.map(
    ({ progressPermille }) => progressPermille / 1_000
  );
  for (const mode of ["reduced-motion", "static", "narrated"] as const) {
    assert.deepEqual(
      [0.2, 0.4, 0.6, 0.8, 1].map((progress) =>
        settleKpExactFractionQuantityAccessibilityProgress({
          progress,
          mode
        })
      ),
      endpoints
    );
    assert.equal(
      settleKpExactFractionQuantityAccessibilityProgress({
        progress: 0,
        mode
      }),
      endpoints[0]
    );
  }
  assert.equal(
    settleKpExactFractionQuantityAccessibilityProgress({
      progress: 0.721,
      mode: "full-motion"
    }),
    0.721
  );
});
