import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpMatrixLinearMapPlan,
  sampleKpMatrixLinearMapFrame,
  type KpMatrixLinearMapAccessibilityMode
} from "../src/animation/matrix-linear-map-frame.ts";

const animation = createKpAnimationAssets().find((candidate) =>
  candidate.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two"
)!;
const plan = createKpMatrixLinearMapPlan(animation);
const modes: readonly KpMatrixLinearMapAccessibilityMode[] = [
  "full-motion",
  "reduced-motion",
  "static",
  "narrated"
];
const sample = (
  progress: number,
  mode: KpMatrixLinearMapAccessibilityMode,
  direction: "forward" | "rewind" = "forward"
) => sampleKpMatrixLinearMapFrame({
  plan,
  progress,
  direction,
  accessibilityMode: mode
});

test("rank-6 seek and rewind are deterministic in every accessibility mode", () => {
  for (const mode of modes) {
    for (const progress of [0, 0.18, 0.37, 0.52, 0.8, 1]) {
      assert.deepEqual(sample(progress, mode), sample(progress, mode));
      const forward = sample(progress, mode);
      const rewind = sample(1 - progress, mode, "rewind");
      assert.deepEqual(
        { ...forward, direction: "rewind" },
        rewind,
        `${mode} rewind drifted at ${progress}`
      );
    }
  }
});

test("reduced and static modes expose only discrete motion values", () => {
  for (const mode of ["reduced-motion", "static"] as const) {
    for (let index = 0; index <= 100; index += 1) {
      const frame = sample(index / 100, mode);
      assert.equal(frame.accessibility.motionPolicy, "discrete");
      assert.ok(motionValues(frame).every((value) => value === 0 || value === 1));
    }
  }
  assert.equal(sample(0.71, "full-motion").accessibility.motionPolicy, "continuous");
  assert.equal(sample(0.71, "narrated").accessibility.motionPolicy, "continuous");
});

test("static playback uses finite semantic checkpoints", () => {
  const rowEnds = plan.choreography.rows.map((row) => row.end);
  const observed = [0.75, 0.8, 0.9, 0.96, 0.99, 1].map((progress) =>
    sample(progress, "static").semanticProgress
  );
  const releaseSpan = 1 - rowEnds[1]!;
  const expected = [
    rowEnds[1]!,
    rowEnds[1]! + releaseSpan * 0.32,
    rowEnds[1]! + releaseSpan * 0.56,
    rowEnds[1]! + releaseSpan * 0.84,
    rowEnds[1]! + releaseSpan * 0.96,
    1
  ];
  observed.forEach((value, index) =>
    assert.ok(Math.abs(value - expected[index]!) < 1e-9)
  );
});

test("every projection preserves exact values and an explicit description", () => {
  for (const mode of modes) {
    const frame = sample(0.8, mode);
    assert.deepEqual(frame.operationBank.rows.map((row) => row.result), [13, 15]);
    assert.deepEqual(frame.geometry.inputCoordinates, [4, 5]);
    assert.deepEqual(frame.geometry.outputCoordinates, [13, 15]);
    assert.match(frame.accessibility.description, /Rows compute output coordinates/);
    assert.match(frame.accessibility.description, /T_A\(e_1\) = \[2, 0\]/);
    assert.equal(frame.accessibility.liveNarration, frame.narration);
  }
});

function motionValues(
  frame: ReturnType<typeof sampleKpMatrixLinearMapFrame>
): readonly number[] {
  return [
    ...frame.operationBank.rows.flatMap((row) => [
      row.routeProgress,
      row.gatherProgress,
      row.coordinateProgress,
      ...row.contributions.map((item) => item.productRevealProgress)
    ]),
    frame.geometry.visibility,
    frame.geometry.basisRevealProgress,
    frame.geometry.gridTransformProgress,
    frame.geometry.sourceVectorRevealProgress,
    frame.geometry.vectorMapProgress,
    frame.geometry.outputVectorRevealProgress
  ];
}
