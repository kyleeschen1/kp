import assert from "node:assert/strict";
import test from "node:test";

import { createKpHeadlessNotationMeasurementBackend } from "../src/animation/headless-notation-measurement-backend.ts";
import { measureKpNativeNotation } from "../src/animation/native-notation-measurement.ts";

test("headless backend produces deterministic native-notation snapshots", async () => {
  const backend = createKpHeadlessNotationMeasurementBackend({
    id: "headless.solve-x",
    viewport: { x: 0, y: 0, width: 320, height: 180 },
    metrics: [{
      glyphId: "x",
      bounds: { x: 16, y: 24, width: 9, height: 17 }
    }],
    protectedRegions: [{
      id: "label",
      ownerEntityId: "label",
      kind: "annotation",
      bounds: { x: 0, y: 0, width: 50, height: 14 }
    }]
  });
  const input = {
    backend,
    glyphs: [{ id: "x", entityId: "term.x", glyphKey: "x", ordinal: 0 }]
  } as const;

  const first = await measureKpNativeNotation(input);
  const second = await measureKpNativeNotation(input);
  assert.deepEqual(first, second);
  assert.equal(first.backendId, "headless.solve-x");
  assert.equal(first.glyphs[0]?.styleFingerprint, "kp-headless-math|400|16px");
});

test("headless backend refuses duplicate or missing glyph metrics", async () => {
  assert.throws(
    () => createKpHeadlessNotationMeasurementBackend({
      id: "duplicate",
      viewport: { x: 0, y: 0, width: 1, height: 1 },
      metrics: [
        { glyphId: "x", bounds: { x: 0, y: 0, width: 1, height: 1 } },
        { glyphId: "x", bounds: { x: 0, y: 0, width: 1, height: 1 } }
      ]
    }),
    /unique glyph ids/
  );
  const backend = createKpHeadlessNotationMeasurementBackend({
    id: "missing",
    viewport: { x: 0, y: 0, width: 1, height: 1 },
    metrics: []
  });
  await assert.rejects(
    measureKpNativeNotation({
      backend,
      glyphs: [{ id: "x", entityId: "x", glyphKey: "x", ordinal: 0 }]
    }),
    /could not measure glyph x/
  );
});
