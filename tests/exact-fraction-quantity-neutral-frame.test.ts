import assert from "node:assert/strict";
import test from "node:test";

import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  sampleKpExactFractionQuantityNeutralFrame
} from "../src/animation/exact-fraction-quantity-neutral-frame.ts";
import {
  createKpExactFractionQuantityTrace
} from "../src/semantic/exact-fraction-quantity-trace.ts";

test("every beat end samples its exact settled checkpoint", () => {
  const trace = createKpExactFractionQuantityTrace();

  manifest.pacing.forEach(({ endPermille }, index) => {
    const frame = sampleKpExactFractionQuantityNeutralFrame({
      progress: endPermille / 1_000,
      trace
    });
    assert.equal(frame.beat.index, index);
    assert.equal(frame.beat.localProgress, 1);
    assert.equal(frame.settledStateId, trace.states[index]?.id);
    assert.equal(
      manifest.checkpoints[index]?.progressPermille,
      endPermille
    );
  });
});

test("refinement samples fission and persistence from exact atomic identity", () => {
  const frame = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.29
  });

  assert.equal(frame.beat.operation, "refine-partition");
  assert.equal(frame.beat.localProgress, 0.5);
  assert.deepEqual(
    frame.selectionTransitions.map(({ lifecycle }) => lifecycle),
    ["fission", "persist"]
  );
  assert.deepEqual(
    frame.selectionTransitions[0]?.atomicPartIds,
    manifest.selections.oneThird.atomicPartIds
  );
});

test("merge and recognition carry the complete selected half cohort", () => {
  const merge = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.69
  });
  const recognition = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.91
  });

  assert.equal(merge.beat.operation, "merge-disjoint-parts");
  assert.deepEqual(merge.selectionTransitions[0]?.sourceSelectionIds, [
    "selection.addend.one-third-as-two-sixths",
    "selection.addend.one-sixth"
  ]);
  assert.equal(merge.selectionTransitions[0]?.lifecycle, "fusion");
  assert.equal(
    recognition.beat.operation,
    "recognize-equivalent-regrouping"
  );
  assert.deepEqual(
    recognition.selectionTransitions[0]?.atomicPartIds,
    manifest.selections.resultHalf.atomicPartIds
  );
});

test("forward and rewind share one canonical frame coordinate", () => {
  const forward = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.73,
    direction: "forward"
  });
  const rewind = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.73,
    direction: "rewind"
  });
  const { direction: _forwardDirection, ...forwardTruth } = forward;
  const { direction: _rewindDirection, ...rewindTruth } = rewind;

  assert.deepEqual(forwardTruth, rewindTruth);
});

test("sampling is history independent, immutable, and clamped", () => {
  const first = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.512
  });
  sampleKpExactFractionQuantityNeutralFrame({ progress: 0.91 });
  const repeated = sampleKpExactFractionQuantityNeutralFrame({
    progress: 0.512
  });
  const low = sampleKpExactFractionQuantityNeutralFrame({
    progress: Number.NaN
  });
  const high = sampleKpExactFractionQuantityNeutralFrame({ progress: 2 });

  assert.deepEqual(first, repeated);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.selectionTransitions));
  assert.equal(low.progress, 0);
  assert.equal(high.progress, 1);
  assert.equal(high.settledStateId, high.targetStateId);
});

test("neutral frames expose no renderer geometry or recomputed arithmetic", () => {
  const serialized = JSON.stringify(
    sampleKpExactFractionQuantityNeutralFrame({ progress: 0.5 }),
    (_key, value) => typeof value === "bigint" ? value.toString() : value
  );

  assert.match(serialized, /"rendererNeutral":true/u);
  assert.doesNotMatch(
    serialized,
    /angle|radius|coordinate|pixel|svg|canvas|webgl|dom-order|computed-value/iu
  );
});
