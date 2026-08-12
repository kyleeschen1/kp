import assert from "node:assert/strict";
import test from "node:test";

import { kpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-canonical-timeline.ts";
import { projectKpSchemeFactorialResponsiveFrame } from
  "../src/animation/scheme-factorial-responsive-projection.ts";
import { sampleKpSchemeFactorialTimeline } from
  "../src/animation/scheme-factorial-timeline.ts";
import { kpSchemeFactorialCheckpoints } from
  "../src/semantic/scheme-factorial-checkpoints.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";

const document = parseKpSchemeFactorialSource();
const sample = sampleKpSchemeFactorialTimeline({
  timeline: kpSchemeFactorialTimeline,
  progress: 0.2
});

function frame(width: number, progress = 0.31, reducedMotion = false) {
  return projectKpSchemeFactorialResponsiveFrame({
    document,
    checkpoints: kpSchemeFactorialCheckpoints,
    sample: sampleKpSchemeFactorialTimeline({
      timeline: kpSchemeFactorialTimeline,
      progress
    }),
    availableWidthPx: width,
    reducedMotion
  });
}

test("reflows compact source geometry without scaling typography", () => {
  const wide = frame(760);
  const compact = frame(320);

  assert.equal(wide.mode, "wide");
  assert.equal(compact.mode, "compact");
  assert.equal(wide.fontSizePx, 18);
  assert.equal(compact.fontSizePx, 18);
  assert.equal(wide.characterAdvanceEm, compact.characterAdvanceEm);
  assert.equal(wide.rows.length, document.sourceText.split("\n").length);
  assert.ok(compact.rows.length > wide.rows.length);
  assert.ok(compact.stage.heightEm > wide.stage.heightEm);
  assert.ok(compact.stage.widthEm < wide.stage.widthEm);
});

test("retains every certified source token once and inside the stage", () => {
  for (const projection of [frame(320), frame(760)]) {
    const ids = projection.tokens.map(({ id }) => id);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual([...projection.tokens].sort((left, right) =>
      left.sourceStart - right.sourceStart).map(({ id }) => id), ids);
    for (const token of projection.tokens) {
      assert.ok(token.rect.xEm >= 0);
      assert.ok(token.rect.yEm >= 0);
      assert.ok(token.rect.xEm + token.rect.widthEm <=
        projection.stage.widthEm + 1e-6);
      assert.ok(token.rect.yEm + token.rect.heightEm <=
        projection.stage.heightEm + 1e-6);
    }
  }
});

test("jostles only active atoms with a restrained deterministic offset", () => {
  const projection = projectKpSchemeFactorialResponsiveFrame({
    document,
    checkpoints: kpSchemeFactorialCheckpoints,
    sample,
    availableWidthPx: 760
  });
  const active = projection.jostle.filter(({ active }) => active);
  const quiet = projection.jostle.filter(({ active }) => !active);

  assert.ok(active.length > 0);
  assert.ok(active.some(({ xEm, yEm }) => xEm !== 0 || yEm !== 0));
  assert.ok(active.every(({ xEm, yEm }) =>
    Math.abs(xEm) <= 0.055 && Math.abs(yEm) <= 0.055));
  assert.ok(quiet.every(({ xEm, yEm }) => xEm === 0 && yEm === 0));
  assert.deepEqual(frame(760, 0.2), frame(760, 0.2));
});

test("settles endpoints and makes reduced motion exactly still", () => {
  for (const progress of [0, 1]) {
    assert.ok(frame(760, progress).jostle.every(({ xEm, yEm }) =>
      xEm === 0 && yEm === 0));
  }
  assert.ok(frame(760, 0.2, true).jostle.every(({ xEm, yEm }) =>
    xEm === 0 && yEm === 0));
});

test("direct seek and rewind produce identical responsive frames", () => {
  const forward = Array.from({ length: 101 }, (_, index) =>
    frame(index % 2 === 0 ? 320 : 760, index / 100));
  const reverse = Array.from({ length: 101 }, (_, index) =>
    frame((100 - index) % 2 === 0 ? 320 : 760, (100 - index) / 100));
  assert.deepEqual(reverse, [...forward].reverse());
});

test("rejects widths that would require unreadable typography", () => {
  assert.throws(() => frame(200), /at least 220px/);
});
