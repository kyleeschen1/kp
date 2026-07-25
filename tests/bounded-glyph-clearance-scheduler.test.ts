import assert from "node:assert/strict";
import test from "node:test";

import { scheduleKpBoundedGlyphClearance } from "../src/animation/bounded-glyph-clearance-scheduler.ts";
import type { KpLineageConstrainedGlyphMatchResult } from "../src/animation/lineage-constrained-glyph-matcher.ts";
import type { KpNativeNotationMeasurementSnapshot } from "../src/animation/native-notation-measurement.ts";

const matches: KpLineageConstrainedGlyphMatchResult = {
  matches: [{
    id: "match.x",
    lineageGroupId: "group.x",
    sourceGlyphId: "source.x",
    targetGlyphId: "target.x",
    glyphKey: "x"
  }],
  multiplicity: [],
  unmatchedSourceGlyphIds: [],
  unmatchedTargetGlyphIds: [],
  ambiguities: [],
  operationCount: 1
};

function snapshot(
  id: string,
  glyphId: string,
  entityId: string,
  x: number,
  protectedX?: number
): KpNativeNotationMeasurementSnapshot {
  return {
    kind: "native-notation-measurement",
    backendId: "headless",
    settlementEpoch: "ready",
    viewport: { x: 0, y: 0, width: 240, height: 120 },
    glyphs: [{
      id: glyphId,
      entityId,
      glyphKey: "x",
      ordinal: 0,
      bounds: { x, y: 50, width: 10, height: 16 },
      styleFingerprint: "KaTeX_Main|400|16"
    }],
    protectedRegions: protectedX === undefined ? [] : [{
      id: `${id}.obstacle`,
      ownerEntityId: "other",
      kind: "ink",
      bounds: { x: protectedX, y: 42, width: 30, height: 32 }
    }]
  };
}

test("scheduler uses a direct route when protected ink is clear", () => {
  const schedule = scheduleKpBoundedGlyphClearance({
    matches,
    source: snapshot("source", "source.x", "x.before", 10),
    target: snapshot("target", "target.x", "x.after", 180),
    maxOperations: 100
  });

  assert.equal(schedule.motions[0]?.status, "direct");
  assert.equal(schedule.motions[0]?.waypoints.length, 2);
  assert.equal(schedule.usedOperationSpecificPolicy, false);
});

test("scheduler chooses a bounded clearance lane around protected ink", () => {
  const schedule = scheduleKpBoundedGlyphClearance({
    matches,
    source: snapshot("source", "source.x", "x.before", 10, 90),
    target: snapshot("target", "target.x", "x.after", 180),
    maxOperations: 100
  });

  assert.equal(schedule.motions[0]?.status, "clearance-route");
  assert.equal(schedule.motions[0]?.waypoints.length, 4);
});

test("scheduler settles honestly when every bounded route is occluded", () => {
  const source = snapshot("source", "source.x", "x.before", 10);
  const wall = {
    id: "wall",
    ownerEntityId: "other",
    kind: "ink" as const,
    bounds: { x: 80, y: 0, width: 80, height: 120 }
  };
  const schedule = scheduleKpBoundedGlyphClearance({
    matches,
    source: { ...source, protectedRegions: [wall] },
    target: snapshot("target", "target.x", "x.after", 180),
    maxOperations: 100
  });

  assert.equal(schedule.motions[0]?.status, "settle");
  assert.equal(schedule.motions[0]?.waypoints.length, 1);
});

test("scheduler enforces the shared operation budget", () => {
  assert.throws(
    () => scheduleKpBoundedGlyphClearance({
      matches,
      source: snapshot("source", "source.x", "x.before", 10, 90),
      target: snapshot("target", "target.x", "x.after", 180),
      maxOperations: 1
    }),
    /limit is 1/
  );
});

test("the same scheduler emits constituent merge and split routes", () => {
  const mergeMatches: KpLineageConstrainedGlyphMatchResult = {
    matches: [],
    multiplicity: [{
      id: "merge.denominators",
      lineageGroupId: "group.denominators",
      kind: "merge",
      sourceGlyphIds: ["source.left", "source.right"],
      targetGlyphIds: ["target.shared"],
      sharedMatchIds: []
    }],
    unmatchedSourceGlyphIds: ["source.left", "source.right"],
    unmatchedTargetGlyphIds: ["target.shared"],
    ambiguities: [],
    operationCount: 3
  };
  const source: KpNativeNotationMeasurementSnapshot = {
    ...snapshot("source", "source.left", "left", 20),
    glyphs: [
      { id: "source.left", entityId: "left", glyphKey: "2", ordinal: 0, bounds: { x: 20, y: 50, width: 10, height: 16 }, styleFingerprint: "math" },
      { id: "source.right", entityId: "right", glyphKey: "2", ordinal: 0, bounds: { x: 140, y: 50, width: 10, height: 16 }, styleFingerprint: "math" }
    ]
  };
  const target: KpNativeNotationMeasurementSnapshot = {
    ...snapshot("target", "target.shared", "shared", 80),
    glyphs: [
      { id: "target.shared", entityId: "shared", glyphKey: "2", ordinal: 0, bounds: { x: 80, y: 70, width: 10, height: 16 }, styleFingerprint: "math" }
    ]
  };
  const schedule = scheduleKpBoundedGlyphClearance({
    matches: mergeMatches,
    source,
    target,
    maxOperations: 100
  });

  assert.equal(schedule.motions.length, 2);
  assert.deepEqual(schedule.motions.map(({ matchId }) => matchId), [
    "merge.denominators.0",
    "merge.denominators.1"
  ]);
  assert.equal(schedule.usedOperationSpecificPolicy, false);
});
