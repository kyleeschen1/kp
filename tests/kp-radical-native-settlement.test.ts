import assert from "node:assert/strict";
import test from "node:test";

import {
  kpRadicalNativeSettlementEnd,
  kpRadicalNativeSettlementStart,
  sampleKpRadicalNativeSettlement
} from "../src/animation/radical-native-settlement.ts";
import {
  kpRadicalConventionalMorphProfile
} from "../src/animation/radical-morph-profile.ts";

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
  const settlement = kpRadicalConventionalMorphProfile.settlement;
  const frame = sampleKpRadicalNativeSettlement({
    semanticProgress: (settlement.start + settlement.end) / 2,
    fragmentRects: [nativeRect],
    nativeRect,
    handoffStart: settlement.start,
    handoffEnd: settlement.end,
    easing: settlement.easing
  });

  assert.equal(frame.phase, "native-handoff");
  assert.equal(frame.nativeOpacity, 0.5);
  assert.ok(Math.abs(frame.fragmentOpacity + frame.nativeOpacity - 1) < 1e-12);
});

test("native handoff uses a symmetric conventional ease-in-out", () => {
  const settlement = kpRadicalConventionalMorphProfile.settlement;
  const duration = settlement.end - settlement.start;
  const early = sampleKpRadicalNativeSettlement({
    semanticProgress: settlement.start + duration * 0.25,
    fragmentRects: [nativeRect],
    nativeRect,
    handoffStart: settlement.start,
    handoffEnd: settlement.end,
    easing: settlement.easing
  });
  const late = sampleKpRadicalNativeSettlement({
    semanticProgress: settlement.start + duration * 0.75,
    fragmentRects: [nativeRect],
    nativeRect,
    handoffStart: settlement.start,
    handoffEnd: settlement.end,
    easing: settlement.easing
  });

  assert.ok(Math.abs(early.nativeOpacity + late.nativeOpacity - 1) < 1e-12);
});

test("the named profile finishes the solid morph before native ownership changes", () => {
  const profile = kpRadicalConventionalMorphProfile;

  assert.equal(profile.morph.end, profile.settlement.start);
  assert.ok(profile.morph.start < profile.morph.end);
  assert.ok(profile.settlement.start < profile.settlement.end);
});
