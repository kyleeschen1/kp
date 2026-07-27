import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateKpEquationVisiblePaintCertifiedContacts,
  evaluateKpEquationVisiblePaintContact,
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

test("semantic contact allowances are explicit, symmetric, and bounded", () => {
  const report = inspectKpEquationVisiblePaintOverlap({
    progress: 0.5,
    viewportId: "wide",
    observations: [
      observation("native", "target-native", 0, 0),
      observation("material", "material", 2, 2),
      observation("unrelated", "material", 4, 4)
    ]
  });
  const forward = evaluateKpEquationVisiblePaintContact({
    report,
    allowances: [{
      id: "contact.handoff",
      ownerIds: ["native", "material"],
      reason: "native-handoff",
      maximumOverlapWidthPx: 8,
      maximumOverlapHeightPx: 8
    }]
  });
  const reverse = evaluateKpEquationVisiblePaintContact({
    report,
    allowances: [{
      id: "contact.handoff",
      ownerIds: ["material", "native"],
      reason: "native-handoff",
      maximumOverlapWidthPx: 8,
      maximumOverlapHeightPx: 8
    }]
  });

  assert.deepEqual(forward, reverse);
  assert.equal(forward.passed, false);
  assert.equal(forward.allowed.length, 1);
  assert.equal(forward.violations.length, 2);
});

test("semantic identity alone never excuses visible overlap", () => {
  const report = inspectKpEquationVisiblePaintOverlap({
    progress: 0.5,
    viewportId: "wide",
    observations: [
      observation("native", "target-native", 0, 0, {
        semanticEntityId: "semantic.x"
      }),
      observation("material", "material", 1, 1, {
        semanticEntityId: "semantic.x"
      })
    ]
  });

  assert.deepEqual(evaluateKpEquationVisiblePaintContact({
    report,
    allowances: []
  }), {
    kind: "equation-visible-paint-contact-evaluation",
    passed: false,
    allowed: [],
    violations: report.intersections
  });
});

test("visible overlap retains bounded compositor contact evidence", () => {
  const semanticContacts = [{
    id: "component.fusion",
    maximumOverlapWidthPx: 8.5,
    maximumOverlapHeightPx: 8.5
  }];
  const report = inspectKpEquationVisiblePaintOverlap({
    progress: 0.5,
    viewportId: "wide",
    observations: [
      observation("left", "material", 0, 0, { semanticContacts }),
      observation("right", "material", 1, 1, { semanticContacts })
    ]
  });

  assert.deepEqual(report.intersections[0]?.leftSemanticContacts, semanticContacts);
  assert.deepEqual(report.intersections[0]?.rightSemanticContacts, semanticContacts);
  assert.equal(evaluateKpEquationVisiblePaintCertifiedContacts({
    report
  }).passed, true);
  assert.equal(evaluateKpEquationVisiblePaintCertifiedContacts({
    report,
    contactTolerancePx: 0
  }).violations.length, 1);
  assert.throws(
    () => inspectKpEquationVisiblePaintOverlap({
      progress: 0.5,
      viewportId: "wide",
      observations: [observation("invalid", "material", 0, 0, {
        semanticContacts: [
          ...semanticContacts,
          { ...semanticContacts[0]! }
        ]
      })]
    }),
    /semantic contacts must be non-empty and unique/
  );
});

test("contact allowances reject duplicate, self, and excessive contact", () => {
  const report = inspectKpEquationVisiblePaintOverlap({
    progress: 0.5,
    viewportId: "wide",
    observations: [
      observation("left", "source-native", 0, 0),
      observation("right", "material", 1, 1)
    ]
  });
  const excessive = evaluateKpEquationVisiblePaintContact({
    report,
    allowances: [{
      id: "contact.small",
      ownerIds: ["left", "right"],
      reason: "typographic-adjacency",
      maximumOverlapWidthPx: 1,
      maximumOverlapHeightPx: 1
    }]
  });
  assert.equal(excessive.passed, false);
  assert.throws(
    () => evaluateKpEquationVisiblePaintContact({
      report,
      allowances: [{
        id: "contact.self",
        ownerIds: ["left", "left"],
        reason: "semantic-fusion",
        maximumOverlapWidthPx: 10,
        maximumOverlapHeightPx: 10
      }]
    }),
    /cannot allow self-contact/
  );
  assert.throws(
    () => evaluateKpEquationVisiblePaintContact({
      report,
      allowances: [
        {
          id: "contact.forward",
          ownerIds: ["left", "right"],
          reason: "semantic-fusion",
          maximumOverlapWidthPx: 10,
          maximumOverlapHeightPx: 10
        },
        {
          id: "contact.reverse",
          ownerIds: ["right", "left"],
          reason: "semantic-fission",
          maximumOverlapWidthPx: 10,
          maximumOverlapHeightPx: 10
        }
      ]
    }),
    /Duplicate visible paint contact allowance/
  );
});
