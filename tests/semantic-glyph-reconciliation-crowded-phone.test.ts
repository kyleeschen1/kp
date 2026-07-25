import assert from "node:assert/strict";
import test from "node:test";

import { createKpCrowdedQuadraticGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-compiler.ts";

test("crowded phone projection reuses identical semantic execution", async () => {
  const wide = createKpCrowdedQuadraticGlyphReconciliationCase("wide");
  const phone = createKpCrowdedQuadraticGlyphReconciliationCase("phone");
  const compiled = await compileKpGlyphReconciliationCase(phone);

  assert.deepEqual(phone.execution, wide.execution);
  assert.equal(phone.viewport.width, 390);
  assert.equal(compiled.schedule.usedOperationSpecificPolicy, false);
  assert.equal(compiled.matches.multiplicity[0]?.kind, "merge");
  assert.equal(compiled.matches.ambiguities.length, 0);
});

test("crowded phone keeps all measured and settled glyphs inside viewport", async () => {
  const compiled = await compileKpGlyphReconciliationCase(
    createKpCrowdedQuadraticGlyphReconciliationCase("phone")
  );
  const rects = [
    ...compiled.sourceMeasurement.glyphs.map(({ bounds }) => bounds),
    ...compiled.targetMeasurement.glyphs.map(({ bounds }) => bounds)
  ];
  assert.ok(rects.every(({ x, width }) =>
    x >= 0 && x + width <= compiled.sourceMeasurement.viewport.width
  ));
  const merge = compiled.matches.multiplicity[0]!;
  const mergeMotions = compiled.schedule.motions.filter(({ matchId }) =>
    matchId.startsWith(`${merge.id}.`)
  );
  assert.ok(mergeMotions.every(({ status }) =>
    status === "clearance-route" || status === "settle"
  ));
});
