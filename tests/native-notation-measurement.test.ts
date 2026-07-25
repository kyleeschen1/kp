import assert from "node:assert/strict";
import test from "node:test";

import {
  measureKpNativeNotation,
  type KpNativeNotationMeasurementBackend
} from "../src/animation/native-notation-measurement.ts";

test("native measurement settles before reading glyphs and protected ink", async () => {
  const order: string[] = [];
  const backend: KpNativeNotationMeasurementBackend = {
    id: "headless.fixture",
    async settle() {
      order.push("settle");
      return "fonts-ready.layout-2";
    },
    viewport() {
      order.push("viewport");
      return { x: 0, y: 0, width: 320, height: 180 };
    },
    measureGlyph(glyph) {
      order.push(`glyph:${glyph.id}`);
      return {
        ...glyph,
        bounds: { x: 10, y: 20, width: 8, height: 16 },
        styleFingerprint: "KaTeX_Main|400|16px|scale(1)"
      };
    },
    protectedRegions() {
      order.push("protected");
      return [{
        id: "annotation",
        ownerEntityId: "x",
        kind: "annotation",
        bounds: { x: 20, y: 0, width: 40, height: 12 }
      }];
    }
  };
  const snapshot = await measureKpNativeNotation({
    backend,
    glyphs: [{ id: "x.glyph", entityId: "x", glyphKey: "x", ordinal: 0 }]
  });

  assert.equal(order[0], "settle");
  assert.equal(snapshot.settlementEpoch, "fonts-ready.layout-2");
  assert.match(snapshot.glyphs[0]!.styleFingerprint, /400/);
  assert.equal(Object.isFrozen(snapshot.glyphs[0]!.bounds), true);
});

test("native measurement rejects identity drift and unsettled styles", async () => {
  const backend: KpNativeNotationMeasurementBackend = {
    id: "bad",
    async settle() { return "ready"; },
    viewport() { return { x: 0, y: 0, width: 1, height: 1 }; },
    measureGlyph(glyph) {
      return {
        ...glyph,
        entityId: "different",
        bounds: { x: 0, y: 0, width: 1, height: 1 },
        styleFingerprint: ""
      };
    },
    protectedRegions() { return []; }
  };

  await assert.rejects(
    measureKpNativeNotation({
      backend,
      glyphs: [{ id: "x", entityId: "x", glyphKey: "x", ordinal: 0 }]
    }),
    /changed semantic identity/
  );
});
