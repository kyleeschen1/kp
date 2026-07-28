import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionVisualMotifTimeline
} from "../src/animation/fraction-composition-visual-motifs.ts";
import {
  checkTransformTreeVisualMotifRewindLaw
} from "../src/animation/motifs/visual-motif-composition.ts";
import {
  kpFractionCompositionPreservationManifest
} from "../src/reader/compiler/fraction-composition-preservation-manifest.ts";

test("every fraction composition operation uses its canonical visual motif", () => {
  const timeline = createKpFractionCompositionVisualMotifTimeline();

  assert.equal(timeline.segments.length, 13);
  assert.deepEqual(
    timeline.segments.map(({ motifKind }) => motifKind),
    [
      "copy-fan-out",
      "fraction-factor-split",
      "successor-synthesis",
      "successor-synthesis",
      "append-after-shift",
      "cancelation",
      "successor-synthesis",
      "append-after-shift",
      "cancelation",
      "successor-synthesis",
      "append-after-shift",
      "cancelation",
      "successor-synthesis"
    ]
  );
  for (const segment of timeline.segments) {
    assert.ok((segment.canonicalOperationIds ?? []).length > 0, segment.id);
    assert.ok((segment.trustedMotifIds ?? []).length > 0, segment.id);
  }
});

test("arithmetic synthesis includes operands and operators without a fade motif", () => {
  const timeline = createKpFractionCompositionVisualMotifTimeline();
  const arithmetic = timeline.segments.filter(
    ({ motifKind }) => motifKind === "successor-synthesis"
  );

  assert.equal(arithmetic.length, 5);
  assert.ok(arithmetic.every(({ motionPrimitiveIds }) =>
    motionPrimitiveIds.includes("merge") &&
    motionPrimitiveIds.includes("shift") &&
    !motionPrimitiveIds.includes("enter") &&
    !motionPrimitiveIds.includes("exit")
  ));
  assert.ok(timeline.segments.every(({ motifKind }) =>
    !(kpFractionCompositionPreservationManifest.motifContract
      .forbiddenMotifKinds as readonly string[]).includes(motifKind)
  ));
});

test("canonical fraction motifs preserve exact rewind and inspection structure", () => {
  const timeline = createKpFractionCompositionVisualMotifTimeline();

  assert.deepEqual(checkTransformTreeVisualMotifRewindLaw(timeline), {
    lawId: "transform-tree-visual-motif.rewind-phase-mirror",
    passed: true,
    failures: []
  });
  assert.deepEqual(
    timeline.rewindPhases.flatMap(({ segmentIds }) => segmentIds),
    [...timeline.forwardPhases.flatMap(({ segmentIds }) => segmentIds)].reverse()
  );
  assert.equal(timeline.annotations.length, 2);
});
