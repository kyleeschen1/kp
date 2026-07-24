import assert from "node:assert/strict";
import test from "node:test";

import {
  composeKpRadicalSettlementRect,
  kpRadicalNativeSettlementEnd,
  kpRadicalNativeSettlementStart,
  kpRadicalSourceNativeSettlementEnd,
  kpRadicalSourceNativeSettlementStart,
  sampleKpRadicalCompositeNativeSettlement,
  sampleKpRadicalNativeSettlement
} from "../src/animation/radical-native-settlement.ts";
import {
  kpRadicalConventionalMorphProfile
} from "../src/animation/radical-morph-profile.ts";

const nativeRect = { left: 20, top: 10, width: 40, height: 28 };

test("composite settlement compares the child union with its native parent", () => {
  const children = [
    { left: 20, top: 10, width: 18, height: 28 },
    { left: 38, top: 10, width: 22, height: 28 }
  ];

  assert.deepEqual(composeKpRadicalSettlementRect(children), nativeRect);
  const frame = sampleKpRadicalCompositeNativeSettlement({
    endpoint: "target",
    semanticProgress: kpRadicalNativeSettlementEnd,
    fragmentRects: children,
    nativeRect,
    handoffStart: kpRadicalNativeSettlementStart,
    handoffEnd: kpRadicalNativeSettlementEnd
  });
  assert.equal(frame.geometryReady, true);
  assert.equal(frame.maximumGeometryResidualPx, 0);
  assert.equal(frame.nativeOpacity, 1);
});

test("source settlement hands the whole native parent to independent children", () => {
  const children = [
    { left: 20, top: 10, width: 40, height: 12 },
    { left: 20, top: 22, width: 40, height: 16 }
  ];
  const start = sampleKpRadicalCompositeNativeSettlement({
    endpoint: "source",
    semanticProgress: kpRadicalSourceNativeSettlementStart,
    fragmentRects: children,
    nativeRect,
    handoffStart: kpRadicalSourceNativeSettlementStart,
    handoffEnd: kpRadicalSourceNativeSettlementEnd
  });
  const middle = sampleKpRadicalCompositeNativeSettlement({
    endpoint: "source",
    semanticProgress: (
      kpRadicalSourceNativeSettlementStart +
      kpRadicalSourceNativeSettlementEnd
    ) / 2,
    fragmentRects: children,
    nativeRect,
    handoffStart: kpRadicalSourceNativeSettlementStart,
    handoffEnd: kpRadicalSourceNativeSettlementEnd
  });
  const end = sampleKpRadicalCompositeNativeSettlement({
    endpoint: "source",
    semanticProgress: kpRadicalSourceNativeSettlementEnd,
    fragmentRects: children,
    nativeRect,
    handoffStart: kpRadicalSourceNativeSettlementStart,
    handoffEnd: kpRadicalSourceNativeSettlementEnd
  });

  assert.equal(start.phase, "native-geometry");
  assert.equal(start.nativeOpacity, 1);
  assert.equal(middle.nativeOpacity, 1);
  assert.equal(middle.fragmentOpacity, 0);
  assert.equal(end.phase, "material-fragments");
  assert.equal(end.fragmentOpacity, 1);
});

test("an unready composite retains the safe endpoint owner", () => {
  const shifted = [{ ...nativeRect, left: nativeRect.left + 1 }];
  const source = sampleKpRadicalCompositeNativeSettlement({
    endpoint: "source",
    semanticProgress: kpRadicalSourceNativeSettlementEnd / 2,
    fragmentRects: shifted,
    nativeRect,
    handoffStart: kpRadicalSourceNativeSettlementStart,
    handoffEnd: kpRadicalSourceNativeSettlementEnd
  });
  const target = sampleKpRadicalCompositeNativeSettlement({
    endpoint: "target",
    semanticProgress: (
      kpRadicalNativeSettlementStart +
      kpRadicalNativeSettlementEnd
    ) / 2,
    fragmentRects: shifted,
    nativeRect,
    handoffStart: kpRadicalNativeSettlementStart,
    handoffEnd: kpRadicalNativeSettlementEnd
  });

  assert.equal(source.phase, "waiting-for-native-geometry");
  assert.equal(source.nativeOpacity, 1);
  assert.equal(target.phase, "waiting-for-native-geometry");
  assert.equal(target.nativeOpacity, 0);
});

test("native handoff waits for fragment geometry before transferring", () => {
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

test("settlement keeps exactly one visual owner at every sample", () => {
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

test("a complete WebGL target waits for the discrete transfer boundary", () => {
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
  assert.equal(frame.nativeOpacity, 0);
  assert.equal(frame.fragmentOpacity, 1);
});

test("native handoff never exposes both owners inside its timing window", () => {
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

  assert.equal(early.nativeOpacity, 0);
  assert.equal(early.fragmentOpacity, 1);
  assert.equal(late.nativeOpacity, 0);
  assert.equal(late.fragmentOpacity, 1);
});

test("the named profile finishes the solid morph before native ownership changes", () => {
  const profile = kpRadicalConventionalMorphProfile;

  assert.equal(profile.morph.end, profile.settlement.start);
  assert.ok(profile.morph.start < profile.morph.end);
  assert.ok(profile.settlement.start < profile.settlement.end);
});
