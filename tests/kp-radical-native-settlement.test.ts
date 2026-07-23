import assert from "node:assert/strict";
import test from "node:test";

import {
  kpRadicalNativeSettlementEnd,
  kpRadicalNativeSettlementStart,
  sampleKpRadicalNativeSettlement
} from "../src/animation/radical-native-settlement.ts";

const nativeRect = { left: 20, top: 10, width: 40, height: 28 };

test("native handoff waits for fragment geometry before crossfading", () => {
  const moving = sampleKpRadicalNativeSettlement({
    semanticProgress: 0.94,
    fragmentRects: [{ ...nativeRect, left: nativeRect.left + 0.5 }],
    nativeRect
  });
  assert.equal(moving.phase, "waiting-for-native-geometry");
  assert.equal(moving.geometryReady, false);
  assert.equal(moving.fragmentOpacity, 1);
  assert.equal(moving.nativeOpacity, 0);
});

test("settlement crossfade conserves one visual owner at every sample", () => {
  for (const semanticProgress of [
    kpRadicalNativeSettlementStart,
    0.92,
    0.94,
    0.96,
    kpRadicalNativeSettlementEnd
  ]) {
    const frame = sampleKpRadicalNativeSettlement({
      semanticProgress,
      fragmentRects: [nativeRect, nativeRect],
      nativeRect
    });
    assert.ok(Math.abs(frame.fragmentOpacity + frame.nativeOpacity - 1) < 1e-12);
  }
});

test("settlement reaches exact native geometry and mirrors under direct seek", () => {
  const forward = sampleKpRadicalNativeSettlement({
    semanticProgress: kpRadicalNativeSettlementEnd,
    fragmentRects: [nativeRect, nativeRect],
    nativeRect
  });
  const rewind = sampleKpRadicalNativeSettlement({
    semanticProgress: kpRadicalNativeSettlementEnd,
    fragmentRects: [nativeRect, nativeRect],
    nativeRect
  });
  assert.deepEqual(rewind, forward);
  assert.equal(forward.phase, "native-geometry");
  assert.equal(forward.fragmentOpacity, 0);
  assert.equal(forward.nativeOpacity, 1);
});

test("a complete WebGL target can hand off to exact native ink earlier", () => {
  const frame = sampleKpRadicalNativeSettlement({
    semanticProgress: 0.75,
    fragmentRects: [nativeRect],
    nativeRect,
    handoffStart: 0.68,
    handoffEnd: 0.92
  });

  assert.equal(frame.phase, "native-handoff");
  assert.ok(frame.nativeOpacity > 0.15);
  assert.ok(frame.nativeOpacity < 0.3);
  assert.ok(Math.abs(frame.fragmentOpacity + frame.nativeOpacity - 1) < 1e-12);
});

test("native handoff uses a symmetric conventional ease-in-out", () => {
  const early = sampleKpRadicalNativeSettlement({
    semanticProgress: 0.72,
    fragmentRects: [nativeRect],
    nativeRect,
    handoffStart: 0.68,
    handoffEnd: 0.92
  });
  const late = sampleKpRadicalNativeSettlement({
    semanticProgress: 0.88,
    fragmentRects: [nativeRect],
    nativeRect,
    handoffStart: 0.68,
    handoffEnd: 0.92
  });

  assert.ok(Math.abs(early.nativeOpacity + late.nativeOpacity - 1) < 1e-12);
});
