import assert from "node:assert/strict";
import test from "node:test";

import {
  settleKpPlaceValueAdditionAccessibilityProgress
} from "../src/animation/place-value-addition-accessibility-sampling.ts";
import {
  kpPlaceValueAdditionVisualReference as reference
} from "../src/reader/compiler/place-value-addition-visual-reference.ts";
import {
  createKpPlaceValueAdditionAccessibleProjection
} from "../src/rendering/place-value-addition-accessible-projection.ts";
import {
  createKpPlaceValueAdditionStaticStepExport
} from "../src/tutorial/place-value-addition-static-step-export.ts";

test("accessible projection covers every causal beat exactly once", () => {
  const projection = createKpPlaceValueAdditionAccessibleProjection();

  assert.equal(projection.foldInvariant, true);
  assert.equal(projection.viewInvariant, true);
  assert.equal(projection.motionInvariant, true);
  assert.deepEqual(
    projection.steps.map(({ beatId }) => beatId),
    reference.beats.map(({ id }) => id)
  );
  assert.deepEqual(
    projection.steps.map(({ progressPermille }) => progressPermille),
    reference.beats.map(({ endPermille }) => endPermille)
  );
  assert.ok(projection.steps.every((step) =>
    step.description.length > 0 &&
    step.accessibleMath.length > 0 &&
    step.focusEntityIds.length > 0 &&
    step.annotationIds.length > 0 &&
    step.nativeHtmlAndMathml.includes(
      '<math xmlns="http://www.w3.org/1998/Math/MathML"'
    )
  ));
  assert.match(
    projection.steps[2]!.description,
    /carry|exchange/iu
  );
  assert.match(
    projection.steps[4]!.description,
    /carry|exchange/iu
  );
});

test("static export preserves seven no-JavaScript written and concrete truths", () => {
  const sequence = createKpPlaceValueAdditionStaticStepExport();

  assert.deepEqual(sequence.diagnostics, []);
  assert.equal(
    sequence.artifact.id,
    "artifact.place-value-addition.static-checkpoints"
  );
  assert.deepEqual(
    sequence.steps.map(({ progress }) => progress),
    reference.beats.map(({ endPermille }) => endPermille / 1_000)
  );
  assert.deepEqual(
    sequence.steps.map(({ frame }) =>
      frame.completedOperationIds.length
    ),
    [1, 2, 3, 4, 5, 6, 7]
  );
  for (const { frame, markers } of sequence.steps) {
    assert.equal(frame.semanticTruth.exactResultVerified, true);
    assert.equal(frame.semanticTruth.finalValue, "434");
    assert.ok(frame.representations.writtenAlgorithm.htmlAndMathml
      .includes("<table"));
    assert.ok(frame.representations.baseTenBlocks.svg.includes(
      '<svg xmlns="http://www.w3.org/2000/svg" role="img"'
    ));
    assert.equal(
      markers?.length,
      frame.focusEntityIds.length + frame.annotationIds.length
    );
  }
  const serialized = JSON.stringify(sequence);
  assert.equal((serialized.match(/role=\\"img\\"/gu) ?? []).length, 14);
  assert.doesNotMatch(serialized, /<script|fade|opacity/iu);
  assert.match(serialized, /exchange for one ten/iu);
  assert.match(serialized, /exchange for one hundred/iu);
});

test("reduced static and narrated modes can only settle semantic endpoints", () => {
  const endpoints = reference.beats.map(
    ({ endPermille }) => endPermille / 1_000
  );
  for (const mode of ["reduced-motion", "static", "narrated"] as const) {
    assert.deepEqual(
      Array.from({ length: 7 }, (_, index) => (index + 1) / 7)
        .map((progress) =>
          settleKpPlaceValueAdditionAccessibilityProgress({
            progress,
            mode
          })
        ),
      endpoints
    );
    assert.equal(
      settleKpPlaceValueAdditionAccessibilityProgress({
        progress: 0,
        mode
      }),
      endpoints[0]
    );
  }
  assert.equal(
    settleKpPlaceValueAdditionAccessibilityProgress({
      progress: 0.635,
      mode: "full-motion"
    }),
    0.635
  );
});
