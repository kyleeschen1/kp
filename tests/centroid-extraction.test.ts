import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileCentroidExtraction } from "../scripts/centroid-extraction-frontend.ts";
import { createCentroidMotion, sampleCentroidMotion } from "../src/animation/centroid-extraction-motion.ts";
import generated from "../src/semantic/centroid-extraction.generated.json" with { type: "json" };
import { centroidClaims, centroidClaimEntities, projectCentroidAttention, validateCentroidClaims } from "../src/tutorial/code-reasoning/centroid-attention.ts";

const before = readFileSync("examples/programming/centroid-before.ts", "utf8");
const after = readFileSync("examples/programming/centroid-after.ts", "utf8");
test("prose targets retain checked identity across native and moving owners", () => {
  const plan = createCentroidMotion();
  validateCentroidClaims(plan.artifact);
  for (const p of [0, .2, .5, .67, 1, .67, .2, 0]) {
    const frame = sampleCentroidMotion(plan, p);
    const tokens = frame.theater.active ? frame.theater.tokens : frame.native.tokens;
    for (const claim of centroidClaims) {
      for (const id of centroidClaimEntities(claim)) assert.ok(tokens.some(token => token.entityId === id));
      for (const token of tokens) assert.equal(projectCentroidAttention(token.entityId, claim.id), centroidClaimEntities(claim).includes(token.entityId) ? "focus" : "context");
    }
  }
  assert.throws(() => projectCentroidAttention("centroid.local.sum", "unknown"), /Unknown/);
  const [first, second, third] = plan.artifact.states;
  assert.throws(() => validateCentroidClaims({ ...plan.artifact, states: [{ ...first, tokens: [] }, second, third] }), /needs repair/);
});
test("checked artifact derives exact source and local role correspondence", () => {
  const result = compileCentroidExtraction(before, after);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.deepEqual(result.artifact, generated);
  const [original, extracted, generalized] = result.artifact.states;
  assert.match(extracted.source, /function mean\(xs: number\[\]\)/);
  assert.match(extracted.source, /return sx \/ xs.length/);
  assert.match(generalized.source, /return s \/ vs.length/);
  for (const state of [extracted, generalized]) {
    assert.match(state.source, /const cx = mean\(xs\);$/);
    assert.doesNotMatch(state.source, /\bsy\b|\bys\b/);
    assert.equal(new Set(state.tokens.map(token => token.id)).size, state.tokens.length);
    for (const token of original.tokens) assert.ok(state.tokens.some(next => next.id === token.id));
  }
});
test("changed arithmetic, captures, effects and wrong calls fail closed", () => {
  for (const [source, target] of [
    [before, after.replace("s += v", "s -= v")],
    [before, after.replace("s = 0", "s = 1")],
    [before, after.replace("s / vs.length", "s / 3")],
    [before, after.replace("const cy = mean(ys)", "const cy = mean(xs)")],
    [before, after.replace("return [cx, cy]", "return [cy, cx]")],
    [before, after + "\nconsole.log('effect');"],
    [before.replace("sx += x", "sx += y"), after],
    [before, after.replace("s += v;", "s += v; vs.reverse();")]
  ]) {
    const result = compileCentroidExtraction(source!, target!);
    assert.equal(result.status, "repair-required");
  }
});
test("sampled motion preserves exact endpoints, continuants and history-independent rewind", () => {
  const plan = createCentroidMotion();
  for (const [p, state] of [[0, "original"], [.5, "extracted"], [1, "generalized"]] as const) {
    const frame = sampleCentroidMotion(plan, p);
    assert.equal(frame.theater.active, false);
    assert.equal(frame.native.id, state);
  }
  const held = sampleCentroidMotion(plan, .67);
  sampleCentroidMotion(plan, .93);
  assert.deepEqual(sampleCentroidMotion(plan, .67), held);
  for (const p of [.1, .2, .3, .4, .6, .7, .8, .9]) {
    const frame = sampleCentroidMotion(plan, p);
    assert.equal(new Set(frame.theater.tokens.map(token => token.id)).size, frame.theater.tokens.length);
    assert.ok(frame.theater.tokens.every(token => token.opacity === 1));
  }
  assert.throws(() => sampleCentroidMotion({ ...plan }, .2), /authority/);
});
