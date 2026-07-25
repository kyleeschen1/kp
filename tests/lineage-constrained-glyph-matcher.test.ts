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

test("matcher retains explicit many-to-one and one-to-many group reconciliation", () => {
  const group = lineage.groups[0]!;
  const merge = matchKpGlyphsWithinSemanticLineage({
    lineage: {
      ...lineage,
      sourceEntityIds: ["a", "b"],
      targetEntityIds: ["sum"],
      groups: [{
        ...group,
        id: "group.merge",
        kind: "many-to-one",
        relation: "merge",
        sourceEntityIds: ["a", "b"],
        targetEntityIds: ["sum"]
      }]
    },
    sourceGlyphs: [
      { id: "s.a", entityId: "a", glyphKey: "x", ordinal: 0 },
      { id: "s.b", entityId: "b", glyphKey: "1", ordinal: 0 }
    ],
    targetGlyphs: [{ id: "t.sum", entityId: "sum", glyphKey: "x", ordinal: 0 }]
  });
  const split = matchKpGlyphsWithinSemanticLineage({
    lineage: {
      ...lineage,
      sourceEntityIds: ["root"],
      targetEntityIds: ["positive", "negative"],
      groups: [{
        ...group,
        id: "group.split",
        kind: "one-to-many",
        relation: "split",
        sourceEntityIds: ["root"],
        targetEntityIds: ["positive", "negative"]
      }]
    },
    sourceGlyphs: [{ id: "s.root", entityId: "root", glyphKey: "r", ordinal: 0 }],
    targetGlyphs: [
      { id: "t.positive", entityId: "positive", glyphKey: "r", ordinal: 0 },
      { id: "t.negative", entityId: "negative", glyphKey: "r", ordinal: 0 }
    ]
  });

  assert.deepEqual(merge.multiplicity[0], {
    id: "glyph-many-to-one.group.merge",
    lineageGroupId: "group.merge",
    kind: "merge",
    sourceGlyphIds: ["s.a", "s.b"],
    targetGlyphIds: ["t.sum"],
    sharedMatchIds: ["glyph-match.group.merge.s.a.t.sum"]
  });
  assert.equal(split.multiplicity[0]?.kind, "split");
  assert.deepEqual(split.multiplicity[0]?.targetGlyphIds, ["t.positive", "t.negative"]);
  assert.equal(split.matches.length, 0);
  assert.equal(split.ambiguities.length, 0);
});
