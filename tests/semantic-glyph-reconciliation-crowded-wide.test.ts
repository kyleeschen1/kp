import assert from "node:assert/strict";
import test from "node:test";

import { createKpCrowdedQuadraticGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-compiler.ts";

test("crowded wide quadratic uses common clearance or honest settlement", async () => {
  const compiled = await compileKpGlyphReconciliationCase(
    createKpCrowdedQuadraticGlyphReconciliationCase("wide")
  );
  const merge = compiled.matches.multiplicity[0];
  const mergeMotions = compiled.schedule.motions.filter(({ matchId }) =>
    matchId.startsWith(`${merge!.id}.`)
  );

  assert.equal(merge?.kind, "merge");
  assert.equal(mergeMotions.length, 3);
  assert.ok(mergeMotions.every(({ status }) =>
    status === "clearance-route" || status === "settle"
  ));
  assert.equal(compiled.schedule.usedOperationSpecificPolicy, false);
  assert.equal(compiled.matches.ambiguities.length, 0);
});

test("crowded wide plus-minus continuant remains semantically matched", async () => {
  const compiled = await compileKpGlyphReconciliationCase(
    createKpCrowdedQuadraticGlyphReconciliationCase("wide")
  );
  const plusMinus = compiled.matches.matches.find(({ glyphKey }) => glyphKey === "±");
  assert.ok(plusMinus);
  assert.equal(
    compiled.schedule.motions.find(({ matchId }) => matchId === plusMinus.id)?.status,
    "direct"
  );
});
