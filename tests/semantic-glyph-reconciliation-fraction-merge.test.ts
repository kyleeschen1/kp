import assert from "node:assert/strict";
import test from "node:test";

import { createKpFractionMergeGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-compiler.ts";

test("canonical fraction denominator merge uses common multiplicity and scheduler", async () => {
  const compiled = await compileKpGlyphReconciliationCase(
    createKpFractionMergeGlyphReconciliationCase()
  );

  assert.equal(compiled.matches.multiplicity[0]?.kind, "merge");
  assert.equal(compiled.matches.ambiguities.length, 0);
  assert.equal(compiled.plan.steps[0]?.disposition, "group-reconcile");
  assert.equal(compiled.schedule.motions.length, 2);
  assert.equal(compiled.schedule.usedOperationSpecificPolicy, false);
  assert.ok(compiled.schedule.motions.every(({ status }) => status === "direct"));
});

test("fraction merge constituent playback converges on one native denominator", async () => {
  const compiled = await compileKpGlyphReconciliationCase(
    createKpFractionMergeGlyphReconciliationCase()
  );
  const ids = new Set(compiled.schedule.motions.map(({ matchId }) => matchId));
  const playback = compiled.createPlayback({
    supportedMatchIds: ids,
    apply() {}
  });
  const endpoint = playback.sample(1);

  assert.equal(endpoint.length, 2);
  assert.equal(endpoint[0]?.x, endpoint[1]?.x);
  assert.equal(endpoint[0]?.y, endpoint[1]?.y);
});
