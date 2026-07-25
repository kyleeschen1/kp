import assert from "node:assert/strict";
import test from "node:test";

import { createKpSolveXGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-cases.ts";
import { compileKpGlyphReconciliationCase } from "../src/animation/semantic-glyph-reconciliation-compiler.ts";

test("canonical solve-x persistence runs through the complete reconciliation path", async () => {
  const input = createKpSolveXGlyphReconciliationCase();
  const compiled = await compileKpGlyphReconciliationCase(input);
  const applied: unknown[] = [];
  const matchId = compiled.schedule.motions[0]!.matchId;
  const playback = compiled.createPlayback({
    supportedMatchIds: new Set([matchId]),
    apply(frame) { applied.push(frame); }
  });

  assert.equal(input.execution.transformationId, "transform.linear-solve.cancel-left-additive-inverse");
  assert.equal(compiled.matches.matches.length, 1);
  assert.equal(compiled.plan.steps[0]?.disposition, "matched");
  assert.equal(compiled.schedule.motions[0]?.status, "direct");
  assert.equal(playback.seek(0)[0]?.x, 123.5);
  assert.equal(playback.seek(1)[0]?.x, 255.5);
  assert.deepEqual(playback.seek(0), playback.seek(0));
  assert.equal(applied.length, 4);
});

test("solve-x settled notation identity and interaction requirements remain canonical", () => {
  const input = createKpSolveXGlyphReconciliationCase();
  assert.equal(input.sourceGlyphs[0]?.glyphKey, input.targetGlyphs[0]?.glyphKey);
  assert.deepEqual(input.requiredCapabilities, [
    "accessibility",
    "annotation",
    "direct-seek",
    "hover",
    "responsive",
    "rewind"
  ]);
  assert.equal(JSON.stringify(input.execution).includes("glyphKey"), false);
});
