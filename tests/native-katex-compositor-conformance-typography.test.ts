import assert from "node:assert/strict";
import test from "node:test";

import { sampleKpNativeKatexTypographyStylePlan } from
  "../src/rendering/native-katex-scene-compositor.ts";

test("carries authoritative expected paint into target-style normalization", () => {
  const expectedPaintRect = Object.freeze({
    left: 10,
    top: 20,
    width: 8,
    height: 12
  });
  const frame = sampleKpNativeKatexTypographyStylePlan({
    kind: "native-katex-typography-style-plan",
    lifecycle: "renderer-session",
    model: "target-style-reverse-flip",
    entries: [{
      id: "entry.carrier",
      materialOwnerId: "native-scene-owner.track.carrier",
      componentId: "component.carrier",
      atomLifecycle: "persist",
      targetPaintAtomId: "target.carrier",
      paintKind: "glyph",
      paintRealization: "realize-target-glyph",
      model: "target-style-reverse-flip",
      targetRect: { left: 30, top: 20, width: 8, height: 12 },
      glyphPaintFrame: {
        sourceLeft: 10,
        sourceTop: 20,
        sourceInsetX: 0,
        sourceInsetY: 0,
        targetInsetX: 0,
        targetInsetY: 0,
        sourceScale: 1
      },
      inverseTranslateX: -20,
      inverseTranslateY: 0,
      inverseScaleX: 1,
      inverseScaleY: 1,
      targetStyleFingerprint: "target-style"
    }]
  }, 0, [{
    trackId: "track.carrier",
    componentId: "component.carrier",
    lifecycle: "persist",
    visualAtomId: "source.carrier",
    paintKind: "glyph",
    sizingMode: "rect",
    rect: { left: 5, top: 6, width: 18, height: 22 },
    expectedPaintRect,
    opacity: 1
  }]);

  assert.equal(frame.entries[0]?.expectedPaintRect, expectedPaintRect);
  assert.deepEqual(frame.entries[0], {
    id: "entry.carrier",
    translateX: -20,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    expectedPaintRect
  });
});
