import assert from "node:assert/strict";
import test from "node:test";

import {
  findKpGlyphFixtureOverlaps,
  kpGlyphReconciliationNegativeFixtures,
  validateKpGlyphReconciliationFixture
} from "../src/animation/semantic-glyph-reconciliation-fixtures.ts";

test("negative fixtures distinguish equal ink from semantic lineage", () => {
  const fixture = byId("fixture.equal-glyph-unrelated-entities");
  assert.equal(fixture.sourceTokens[0]?.glyphKey, fixture.targetTokens[0]?.glyphKey);
  assert.notEqual(
    fixture.sourceTokens[0]?.semanticEntityId,
    fixture.targetTokens[0]?.semanticEntityId
  );
  assert.equal(fixture.lineageCandidates.length, 0);
  assert.equal(fixture.expectedDisposition, "unmatched");
});

test("repeated glyphs retain both plausible semantic lineages as ambiguity", () => {
  const fixture = byId("fixture.repeated-token-ambiguous-lineage");
  assert.equal(fixture.lineageCandidates.length, 2);
  assert.deepEqual(
    fixture.lineageCandidates.map(({ lineages }) =>
      lineages.map(({ sourceEntityIds, targetEntityIds }) => [
        sourceEntityIds[0],
        targetEntityIds[0]
      ])
    ),
    [
      [
        ["entity.source-left", "entity.target-left"],
        ["entity.source-right", "entity.target-right"]
      ],
      [
        ["entity.source-left", "entity.target-right"],
        ["entity.source-right", "entity.target-left"]
      ]
    ]
  );
  assert.equal(fixture.expectedDisposition, "ambiguous");
});

test("unsupported lineage is explicit fallback evidence", () => {
  const fixture = byId("fixture.unsupported-lineage-relation");
  assert.equal(
    fixture.lineageCandidates[0]?.lineages[0]?.relation,
    "unsupported"
  );
  assert.equal(fixture.expectedDisposition, "fallback");
});

test("crowded quadratic baseline reproduces protected-ink overlap at both widths", () => {
  const fixture = byId("fixture.quadratic-discriminant-crowding");
  assert.deepEqual(fixture.viewports.map(({ id }) => id), ["wide", "phone"]);
  for (const viewport of fixture.viewports) {
    assert.ok(findKpGlyphFixtureOverlaps(viewport).length > 0);
  }
  assert.equal(fixture.expectedDisposition, "clearance-required");
});

test("all reconciliation fixtures are valid and deeply immutable", () => {
  for (const fixture of kpGlyphReconciliationNegativeFixtures) {
    assert.deepEqual(validateKpGlyphReconciliationFixture(fixture), []);
    assert.equal(Object.isFrozen(fixture), true);
    assert.equal(Object.isFrozen(fixture.sourceTokens), true);
    assert.equal(Object.isFrozen(fixture.lineageCandidates), true);
    assert.equal(Object.isFrozen(fixture.viewports), true);
  }
});

function byId(id: string) {
  const fixture = kpGlyphReconciliationNegativeFixtures.find(
    (candidate) => candidate.id === id
  );
  assert.ok(fixture);
  return fixture;
}
