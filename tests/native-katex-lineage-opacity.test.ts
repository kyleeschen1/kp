import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpNativeKatexSceneTracks
} from "../src/rendering/native-katex-scene-compositor.ts";
import type {
  KpNativeKatexSceneTrack
} from "../src/rendering/native-katex-base-scene-plan.ts";

const rect = { left: 0, top: 0, width: 12, height: 2 };

function track(
  lifecycle: "persist" | "split" | "merge",
  index: number
): KpNativeKatexSceneTrack {
  return {
    id: `track.${lifecycle}.${index}`,
    componentId: `component.${lifecycle}`,
    lifecycle,
    sourceAtomId: `source.${index}`,
    targetAtomId: `target.${index}`,
    visualAtomId: `source.${index}`,
    paintKind: "rule",
    sizingMode: "rule-length",
    startRect: rect,
    endRect: { ...rect, left: 50 + index * 20, width: 24 },
    startOpacity: 1,
    endOpacity: 1
  };
}

test("lineage-backed fission and fusion are opaque at every dense sample", () => {
  const tracks = [
    track("persist", 0),
    track("split", 1),
    track("split", 2),
    track("merge", 3),
    track("merge", 4)
  ];

  for (let index = 0; index <= 100; index += 1) {
    const frames = sampleKpNativeKatexSceneTracks(tracks, index / 100);
    assert.ok(frames.every(({ opacity }) => opacity === 1));
    assert.ok(frames.every(({ rect: frameRect }) =>
      Object.values(frameRect).every(Number.isFinite)
    ));
  }
});
