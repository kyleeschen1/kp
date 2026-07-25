import assert from "node:assert/strict";
import test from "node:test";

import { matchKpGlyphsWithinSemanticLineage } from "../src/animation/lineage-constrained-glyph-matcher.ts";
import type { KpCanonicalLineageProjection } from "../src/animation/canonical-operation-lineage-adapter.ts";

const lineage: KpCanonicalLineageProjection = {
  kind: "canonical-lineage-projection",
  id: "lineage",
  sourceEntityIds: ["left.before", "right.before"],
  targetEntityIds: ["left.after", "right.after"],
  groups: [
    {
      id: "group.left",
      kind: "one-to-one",
      relation: "persist",
      sourceEntityIds: ["left.before"],
      targetEntityIds: ["left.after"],
      authority: {
        executionTransformationId: "t",
        operationSpecId: "kp.core.persist",
        lineageGraphId: "g",
        lineageEdgeId: "left"
      }
    },
    {
      id: "group.right",
      kind: "one-to-one",
      relation: "persist",
      sourceEntityIds: ["right.before"],
      targetEntityIds: ["right.after"],
      authority: {
        executionTransformationId: "t",
        operationSpecId: "kp.core.persist",
        lineageGraphId: "g",
        lineageEdgeId: "right"
      }
    }
  ]
};

test("matcher pairs unique glyphs only inside their semantic lineage group", () => {
  const result = matchKpGlyphsWithinSemanticLineage({
    lineage,
    sourceGlyphs: [
      { id: "s.left.x", entityId: "left.before", glyphKey: "x", ordinal: 0 },
      { id: "s.right.x", entityId: "right.before", glyphKey: "x", ordinal: 0 }
    ],
    targetGlyphs: [
      { id: "t.left.x", entityId: "left.after", glyphKey: "x", ordinal: 0 },
      { id: "t.right.x", entityId: "right.after", glyphKey: "x", ordinal: 0 }
    ]
  });

  assert.deepEqual(
    result.matches.map(({ sourceGlyphId, targetGlyphId }) => [sourceGlyphId, targetGlyphId]),
    [["s.left.x", "t.left.x"], ["s.right.x", "t.right.x"]]
  );
  assert.deepEqual(result.ambiguities, []);
});

test("equal glyphs without semantic lineage remain unmatched", () => {
  const result = matchKpGlyphsWithinSemanticLineage({
    lineage,
    sourceGlyphs: [{ id: "s.left.x", entityId: "left.before", glyphKey: "x", ordinal: 0 }],
    targetGlyphs: [{ id: "t.right.x", entityId: "right.after", glyphKey: "x", ordinal: 0 }]
  });

  assert.deepEqual(result.matches, []);
  assert.deepEqual(result.unmatchedSourceGlyphIds, ["s.left.x"]);
  assert.deepEqual(result.unmatchedTargetGlyphIds, ["t.right.x"]);
});

test("repeated plausible glyphs produce ambiguity rather than arbitrary pairing", () => {
  const result = matchKpGlyphsWithinSemanticLineage({
    lineage: { ...lineage, groups: [lineage.groups[0]!] },
    sourceGlyphs: [
      { id: "s.x.0", entityId: "left.before", glyphKey: "x", ordinal: 0 },
      { id: "s.x.1", entityId: "left.before", glyphKey: "x", ordinal: 1 }
    ],
    targetGlyphs: [
      { id: "t.x.0", entityId: "left.after", glyphKey: "x", ordinal: 0 },
      { id: "t.x.1", entityId: "left.after", glyphKey: "x", ordinal: 1 }
    ]
  });

  assert.deepEqual(result.matches, []);
  assert.deepEqual(result.ambiguities[0]?.sourceGlyphIds, ["s.x.0", "s.x.1"]);
});

test("matcher rejects observations outside canonical lineage", () => {
  assert.throws(
    () => matchKpGlyphsWithinSemanticLineage({
      lineage,
      sourceGlyphs: [{ id: "s", entityId: "not-authorized", glyphKey: "x", ordinal: 0 }],
      targetGlyphs: []
    }),
    /outside canonical lineage/
  );
});
