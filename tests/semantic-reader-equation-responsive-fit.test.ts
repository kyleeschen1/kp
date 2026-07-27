import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpReaderEquationMotionConformance,
  planKpReaderEquationResponsiveFit,
  planKpReaderEquationSequenceResponsiveFit,
  type KpReaderEquationPerceptualAlignmentPlan,
  type KpReaderEquationSymbolMotionFrame
} from "../src/reader/renderers/public-api.ts";
import {
  assertKpEquationStageMeasurementIdentity,
  createKpEquationStageMeasurementIdentity
} from "../src/reader/runtime/equation-stage-layout.ts";

const measurementIdentity = createKpEquationStageMeasurementIdentity({
  revision: 2,
  coordinateSpaceId: "fixture.solve-stage"
});

const alignment: KpReaderEquationPerceptualAlignmentPlan = {
  id: "alignment.solve",
  kind: "reader-equation-perceptual-alignment-plan",
  layoutSnapshotId: "layout.solve",
  measurementIdentity,
  direction: "forward",
  correction: { x: 0, y: 0, rawX: 0, rawY: 0, clamped: false },
  owners: [{
    ownerId: "owner.x",
    sourceBounds: { left: 20, top: 10, width: 80, height: 20 },
    targetBounds: { left: 80, top: 10, width: 140, height: 20 }
  }]
};

test("a sequence shares one fit transform across transition envelopes", () => {
  const second = {
    ...alignment,
    id: "alignment.solve.second",
    owners: [{
      ownerId: "owner.equals",
      sourceBounds: { left: 60, top: 10, width: 10, height: 20 },
      targetBounds: { left: 260, top: 10, width: 10, height: 20 }
    }]
  };
  const fit = planKpReaderEquationSequenceResponsiveFit({
    id: "solve-x",
    alignments: [alignment, second],
    viewportWidth: 300,
    horizontalPadding: 10
  });

  assert.equal(fit.alignmentPlanId, "sequence.solve-x");
  assert.deepEqual(fit.contentBounds, {
    left: 20,
    top: 10,
    width: 250,
    height: 20
  });
  assert.equal(fit.translateX, 5);
  assert.equal(fit.geometrySource, "alignment-envelope");
  assert.deepEqual(fit.measurementIdentity, measurementIdentity);
});

test("responsive fit rejects stale revisions and mixed coordinate spaces", () => {
  for (const mismatched of [
    { revision: 3, coordinateSpaceId: measurementIdentity.coordinateSpaceId },
    { revision: 2, coordinateSpaceId: "fixture.other-stage" }
  ]) {
    assert.throws(
      () => planKpReaderEquationSequenceResponsiveFit({
        id: "mixed-identity",
        alignments: [
          alignment,
          { ...alignment, id: "alignment.mismatch", measurementIdentity: mismatched }
        ],
        viewportWidth: 300
      }),
      /measurement identity mismatch/
    );
    assert.throws(
      () => assertKpEquationStageMeasurementIdentity(
        measurementIdentity,
        mismatched,
        "Fixture"
      ),
      /measurement identity mismatch/
    );
  }
});

test("responsive fit preserves native size then scales without wrapping", () => {
  const wide = planKpReaderEquationResponsiveFit({
    alignment,
    viewportWidth: 260,
    horizontalPadding: 10
  });
  assert.equal(wide.status, "native");
  assert.equal(wide.scale, 1);
  assert.equal(wide.wrapAllowed, false);

  const narrow = planKpReaderEquationResponsiveFit({
    alignment,
    viewportWidth: 180,
    horizontalPadding: 10,
    minScale: 0.7
  });
  assert.equal(narrow.status, "scaled");
  assert.equal(narrow.scale, 0.8);
  assert.equal(narrow.translateX, -6);

  const tooNarrow = planKpReaderEquationResponsiveFit({
    alignment,
    viewportWidth: 110,
    horizontalPadding: 10,
    minScale: 0.7
  });
  assert.equal(tooNarrow.status, "overflow");
  assert.equal(tooNarrow.scale, 0.7);
  assert.ok(tooNarrow.requiredScale < tooNarrow.scale);
});

test("reader containment fits below the legibility threshold and centers both axes", () => {
  const contained = planKpReaderEquationResponsiveFit({
    alignment,
    viewportWidth: 110,
    viewportHeight: 80,
    horizontalPadding: 10,
    verticalPadding: 10,
    minScale: 0.7,
    overflowStrategy: "contain"
  });

  assert.equal(contained.status, "contained");
  assert.equal(contained.scale, contained.requiredScale);
  assert.equal(contained.scale, 0.45);
  assert.equal(contained.translateX, 1);
  assert.equal(contained.translateY, 31);
});

test("reader containment also scales tall notation to the card height", () => {
  const tallAlignment = {
    ...alignment,
    id: "alignment.tall",
    owners: [{
      ownerId: "owner.radical",
      sourceBounds: { left: 10, top: 0, width: 80, height: 160 },
      targetBounds: { left: 10, top: 0, width: 80, height: 160 }
    }]
  };
  const contained = planKpReaderEquationResponsiveFit({
    alignment: tallAlignment,
    viewportWidth: 220,
    viewportHeight: 100,
    horizontalPadding: 10,
    verticalPadding: 10,
    minScale: 0.7,
    overflowStrategy: "contain"
  });

  assert.equal(contained.status, "contained");
  assert.equal(contained.scale, 0.5);
  assert.equal(contained.translateX, 85);
  assert.equal(contained.translateY, 10);
});

test("motion conformance reports overflow and fitted owner escapes", () => {
  const fit = planKpReaderEquationResponsiveFit({
    alignment,
    viewportWidth: 180,
    horizontalPadding: 10,
    minScale: 0.7
  });
  const motion: KpReaderEquationSymbolMotionFrame = {
    id: "motion.solve",
    kind: "reader-equation-symbol-motion-frame",
    materialPlanId: "material.solve",
    alignmentPlanId: alignment.id,
    progress: 0.5,
    easedProgress: 0.5,
    direction: "forward",
    samplingAuthority: "operation-specific",
    owners: [{
      ownerId: "owner.x",
      lifecycle: "persist",
      continuity: "source-target",
      sourceAnchorIds: ["anchor.source.x"],
      targetAnchorIds: ["anchor.target.x"],
      visualAnchorIds: ["anchor.source.x"],
      currentBounds: { left: 50, top: 10, width: 100, height: 20 },
      materialOpacity: 1,
      sourceNativeOpacity: 0,
      targetNativeOpacity: 0,
      focusStrength: 0,
      fragmentPoses: []
    }]
  };
  assert.deepEqual(
    checkKpReaderEquationMotionConformance({ motion, fit }),
    []
  );

  const escaped = {
    ...motion,
    owners: [{
      ...motion.owners[0]!,
      currentBounds: { left: 250, top: 10, width: 40, height: 20 }
    }]
  };
  assert.deepEqual(
    checkKpReaderEquationMotionConformance({ motion: escaped, fit })
      .map((issue) => issue.code),
    ["equation-conformance.owner-out-of-bounds"]
  );

  const overflow = planKpReaderEquationResponsiveFit({
    alignment,
    viewportWidth: 110,
    horizontalPadding: 10,
    minScale: 0.7
  });
  assert.deepEqual(
    checkKpReaderEquationMotionConformance({ motion, fit: overflow })
      .map((issue) => issue.code),
    ["equation-conformance.responsive-overflow"]
  );
});

test("responsive fit rejects impossible viewport contracts", () => {
  assert.throws(
    () => planKpReaderEquationResponsiveFit({
      alignment,
      viewportWidth: 20,
      horizontalPadding: 10
    }),
    /no available inline space/
  );
  assert.throws(
    () => planKpReaderEquationResponsiveFit({
      alignment,
      viewportWidth: 200,
      minScale: 1.2
    }),
    /within \(0, 1\]/
  );
});
