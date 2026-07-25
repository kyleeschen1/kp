import assert from "node:assert/strict";
import test from "node:test";

import { createKpQuadraticPlusMinusGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-compiler.ts";

test("canonical plus-minus source splits into stable quadratic branch ids", async () => {
  const input = createKpQuadraticPlusMinusGlyphReconciliationCase();
  const compiled = await compileKpGlyphReconciliationCase(input);

  assert.equal(input.execution.operationSpecId, "kp.core.fan-out");
  assert.deepEqual(input.execution.lineageGraph.targetEntityIds, [
    "branch.method.quadratic.completing-square.minus",
    "branch.method.quadratic.completing-square.plus"
  ]);
  assert.equal(compiled.matches.multiplicity[0]?.kind, "split");
  assert.equal(compiled.matches.ambiguities.length, 0);
  assert.equal(compiled.schedule.motions.length, 2);
  assert.equal(compiled.schedule.usedOperationSpecificPolicy, false);
});

test("plus-minus static-JS playback preserves exact split endpoints and rewind", async () => {
  const compiled = await compileKpGlyphReconciliationCase(
    createKpQuadraticPlusMinusGlyphReconciliationCase()
  );
  const playback = compiled.createPlayback({
    supportedMatchIds: new Set(compiled.schedule.motions.map(({ matchId }) => matchId)),
    apply() {}
  });
  const origin = playback.sample(0);
  const branches = playback.sample(1);

  assert.equal(origin[0]?.x, origin[1]?.x);
  assert.notEqual(branches[0]?.x, branches[1]?.x);
  assert.deepEqual(playback.sample(0), origin);
});
