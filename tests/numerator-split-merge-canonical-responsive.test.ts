import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  planKpReaderEquationSequenceResponsiveFit,
  type KpReaderEquationPerceptualAlignmentPlan
} from "../src/reader/renderers/public-api.ts";

const measurementIdentity = {
  revision: 1,
  coordinateSpaceId: "fixture.fraction-stage"
} as const;

const alignments: readonly KpReaderEquationPerceptualAlignmentPlan[] = [
  {
    id: "alignment.fraction.split",
    kind: "reader-equation-perceptual-alignment-plan",
    layoutSnapshotId: "layout.fraction.split",
    measurementIdentity,
    direction: "forward",
    correction: { x: 0, y: 0, rawX: 0, rawY: 0, clamped: false },
    owners: [{
      ownerId: "owner.combined",
      sourceBounds: { left: 20, top: 10, width: 92, height: 58 },
      targetBounds: { left: 0, top: 10, width: 164, height: 58 }
    }]
  },
  {
    id: "alignment.fraction.merge",
    kind: "reader-equation-perceptual-alignment-plan",
    layoutSnapshotId: "layout.fraction.merge",
    measurementIdentity,
    direction: "forward",
    correction: { x: 0, y: 0, rawX: 0, rawY: 0, clamped: false },
    owners: [{
      ownerId: "owner.split",
      sourceBounds: { left: 0, top: 10, width: 164, height: 58 },
      targetBounds: { left: 20, top: 10, width: 92, height: 58 }
    }]
  }
];

test("wide and phone fraction frames use one sequence envelope and no wrapping", () => {
  const wide = planKpReaderEquationSequenceResponsiveFit({
    id: "fraction-round-trip",
    alignments,
    viewportWidth: 360,
    horizontalPadding: 20,
    minScale: 0.68
  });
  const phone = planKpReaderEquationSequenceResponsiveFit({
    id: "fraction-round-trip",
    alignments,
    viewportWidth: 170,
    horizontalPadding: 20,
    minScale: 0.68
  });

  assert.deepEqual(phone.contentBounds, wide.contentBounds);
  assert.equal(wide.status, "native");
  assert.equal(wide.scale, 1);
  assert.equal(phone.status, "scaled");
  assert.equal(phone.scale, 130 / 164);
  assert.equal(wide.wrapAllowed, false);
  assert.equal(phone.wrapAllowed, false);
  assert.equal(wide.alignmentPlanId, phone.alignmentPlanId);
});

test("canonical renderer session contains no viewport or fraction dispatch", () => {
  const source = readFileSync(
    "src/reader/app/reader-canonical-equation-session.ts",
    "utf8"
  );
  for (const forbidden of [
    "innerWidth",
    "matchMedia",
    "viewportWidth",
    "fraction",
    "numerator",
    "phone"
  ]) {
    assert.equal(source.includes(forbidden), false);
  }
});
