import assert from "node:assert/strict";
import test from "node:test";
import {
  inspectKpEquationVisiblePaintOverlap,
  type KpEquationVisiblePaintObservation
} from "../src/rendering/equation-visible-paint-overlap.ts";

const observation = (
  ownerId: string,
  authority: KpEquationVisiblePaintObservation["authority"],
  left: number,
  top: number,
  overrides: Partial<KpEquationVisiblePaintObservation> = {}
): KpEquationVisiblePaintObservation => ({
  ownerId,
  authority,
  rect: { left, top, width: 10, height: 10 },
  opacity: 1,
  ...overrides
});

test("visible paint diagnostic classifies every authority pairing", () => {
  const report = inspectKpEquationVisiblePaintOverlap({
    progress: 0.5,
    viewportId: "phone",
    observations: [
      observation("source", "source-native", 0, 0, {
        semanticEntityId: "semantic.source",
        rowId: "row.left"
      }),
      observation("target", "target-native", 2, 2, {
        semanticEntityId: "semantic.target",
        rowId: "row.right"
      }),
      observation("material-a", "material", 4, 4),
      observation("material-b", "material", 6, 6)
    ]
  });

  assert.equal(report.observationCount, 4);
  assert.deepEqual(
    [...new Set(report.intersections.map(({ kind }) => kind))].sort(),
    ["material-material", "native-material", "native-native"]
  );
  assert.deepEqual(report.intersections[0], {
    kind: "native-native",
    leftOwnerId: "source",
    rightOwnerId: "target",
    leftSemanticEntityId: "semantic.source",
    rightSemanticEntityId: "semantic.target",
    leftRowId: "row.left",
    rightRowId: "row.right",
    width: 8,
    height: 8
  });
});

test("visible paint diagnostic excludes hidden and tolerated edge contact", () => {
  const report = inspectKpEquationVisiblePaintOverlap({
    progress: 0,
    viewportId: "wide",
    visibleOpacityThreshold: 0.05,
    contactTolerancePx: 0.5,
    observations: [
      observation("left", "source-native", 0, 0),
      observation("edge", "material", 9.75, 0),
      observation("hidden", "material", 2, 2, { opacity: 0.05 })
    ]
  });

  assert.equal(report.observationCount, 2);
  assert.deepEqual(report.intersections, []);
});

test("visible paint diagnostic rejects duplicate or invalid owners", () => {
  assert.throws(
    () => inspectKpEquationVisiblePaintOverlap({
      progress: 0.5,
      viewportId: "wide",
      observations: [
        observation("same", "source-native", 0, 0),
        observation("same", "material", 5, 5)
      ]
    }),
    /Duplicate visible paint owner same/
  );
  assert.throws(
    () => inspectKpEquationVisiblePaintOverlap({
      progress: 2,
      viewportId: "wide",
      observations: []
    }),
    /progress must be between zero and one/
  );
});
